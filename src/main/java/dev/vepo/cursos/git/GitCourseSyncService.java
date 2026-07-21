package dev.vepo.cursos.git;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.yaml.snakeyaml.Yaml;

import dev.vepo.cursos.category.CategoryService;
import dev.vepo.cursos.course.AulaBlock;
import dev.vepo.cursos.course.AulaBlockRepository;
import dev.vepo.cursos.course.AulaBlockType;
import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.course.CourseItem;
import dev.vepo.cursos.course.CourseItemRepository;
import dev.vepo.cursos.course.CourseResource;
import dev.vepo.cursos.course.CourseResourceRepository;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class GitCourseSyncService {

    private final CourseService courseService;
    private final CourseGitLinkRepository courseGitLinkRepository;
    private final CourseItemRepository courseItemRepository;
    private final AulaBlockRepository aulaBlockRepository;
    private final CourseResourceRepository courseResourceRepository;
    private final CategoryService categoryService;

    @Inject
    public GitCourseSyncService(CourseService courseService,
                                CourseGitLinkRepository courseGitLinkRepository,
                                CourseItemRepository courseItemRepository,
                                AulaBlockRepository aulaBlockRepository,
                                CourseResourceRepository courseResourceRepository,
                                CategoryService categoryService) {
        this.courseService = courseService;
        this.courseGitLinkRepository = courseGitLinkRepository;
        this.courseItemRepository = courseItemRepository;
        this.aulaBlockRepository = aulaBlockRepository;
        this.courseResourceRepository = courseResourceRepository;
        this.categoryService = categoryService;
    }

    @Transactional
    public CourseGitRepository link(long courseId, LinkCourseGitRequest request, PassportUser teacher) {
        var course = courseService.requireTaughtBy(courseId, teacher);
        var existing = courseGitLinkRepository.findByCourseId(courseId);
        if (existing.isPresent()) {
            existing.get().updateLink(request.remoteUrl().trim(), request.defaultBranch(), request.descriptionPath());
            return existing.get();
        }
        return courseGitLinkRepository.save(new CourseGitRepository(course, request.remoteUrl().trim(), request.defaultBranch(), request.descriptionPath()));
    }

    @Transactional
    public void unlink(long courseId, PassportUser teacher) {
        courseService.requireTaughtBy(courseId, teacher);
        var existing = courseGitLinkRepository.findByCourseId(courseId)
                                              .orElseThrow(() -> CursosException.notFound("Git repository not linked"));
        courseGitLinkRepository.delete(existing);
    }

    public CourseGitStatusResponse status(long courseId, PassportUser teacher) {
        courseService.requireTaughtBy(courseId, teacher);
        return courseGitLinkRepository.findByCourseId(courseId)
                                      .map(CourseGitStatusResponse::load)
                                      .orElseThrow(() -> CursosException.notFound("Git repository not linked"));
    }

    @Transactional
    public CourseGitStatusResponse sync(long courseId, PassportUser teacher) {
        var course = courseService.requireTaughtBy(courseId, teacher);
        var link = courseGitLinkRepository.findByCourseId(courseId)
                                          .orElseThrow(() -> CursosException.notFound("Git repository not linked"));
        Path workDir = null;
        try {
            workDir = Files.createTempDirectory("cursos-git-");
            var repoDir = workDir.resolve("repo");
            cloneShallow(link.getRemoteUrl(), link.getDefaultBranch(), repoDir);
            var sha = readHeadSha(repoDir);
            var descriptionFile = repoDir.resolve(link.getDescriptionPath()).normalize();
            if (!descriptionFile.startsWith(repoDir) || !Files.isRegularFile(descriptionFile)) {
                throw CursosException.badRequest("Course description file not found: %s".formatted(link.getDescriptionPath()));
            }
            importDescription(course, descriptionFile, repoDir);
            link.markSynced(sha);
            return CourseGitStatusResponse.load(link);
        } catch (CursosException ex) {
            link.markFailed(ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            link.markFailed(ex.getMessage());
            throw CursosException.badRequest("Git sync failed: %s".formatted(ex.getMessage()));
        } finally {
            if (workDir != null) {
                deleteRecursive(workDir);
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void importDescription(Course course, Path descriptionFile, Path repoDir) throws IOException {
        var yaml = new Yaml();
        var root = yaml.load(Files.readString(descriptionFile, StandardCharsets.UTF_8));
        if (!(root instanceof Map<?, ?> map)) {
            throw CursosException.badRequest("course.yml must be a mapping");
        }
        if (map.get("title") instanceof String title && !title.isBlank()) {
            course.updateDetails(title, map.get("summary") instanceof String summary ? summary : course.getSummary());
        } else if (map.get("summary") instanceof String summary) {
            course.updateDetails(course.getTitle(), summary);
        }
        if (map.get("categories") instanceof List<?> categories) {
            var resolved = new LinkedHashSet<dev.vepo.cursos.category.Category>();
            for (var category : categories) {
                if (category != null) {
                    resolved.add(categoryService.findOrCreateByName(category.toString()));
                }
            }
            course.replaceCategories(resolved);
        }
        if (!(map.get("items") instanceof List<?> items)) {
            throw CursosException.badRequest("course.yml must declare items");
        }
        var keepPaths = new ArrayList<String>();
        int order = 0;
        for (var raw : items) {
            if (!(raw instanceof Map<?, ?> itemMap)) {
                throw CursosException.badRequest("Each item must be a mapping");
            }
            var path = stringValue(itemMap.get("path"));
            var type = stringValue(itemMap.get("type"));
            var title = stringValue(itemMap.get("title"));
            if (path == null || type == null || title == null) {
                throw CursosException.badRequest("Each item requires path, type, and title");
            }
            var file = descriptionFile.getParent().resolve(path).normalize();
            if (!file.startsWith(repoDir) || !Files.isRegularFile(file)) {
                throw CursosException.badRequest("Missing course file: %s".formatted(path));
            }
            keepPaths.add(path);
            var blockType = switch (type.toLowerCase(Locale.ROOT)) {
                case "markdown", "md" -> AulaBlockType.MARKDOWN;
                case "image" -> AulaBlockType.IMAGE;
                case "video" -> AulaBlockType.VIDEO;
                default -> throw CursosException.badRequest("Unsupported item type: %s".formatted(type));
            };
            var existing = courseItemRepository.findByCourseAndSourcePath(course.getId(), path);
            final int sortOrder = order;
            CourseItem item = existing.orElseGet(() -> new CourseItem(course, title, sortOrder));
            item.updateTitle(title);
            item.reorder(sortOrder);
            item.bindSourcePath(path);
            if (existing.isEmpty()) {
                courseItemRepository.save(item);
            }
            var blocks = aulaBlockRepository.listByItem(item.getId());
            AulaBlock block = blocks.isEmpty()
                                               ? aulaBlockRepository.save(new AulaBlock(item, blockType, 0))
                                               : blocks.get(0);
            if (blockType == AulaBlockType.MARKDOWN) {
                block.updateMarkdown(Files.readString(file, StandardCharsets.UTF_8));
            } else {
                var bytes = Files.readAllBytes(file);
                var contentType = Files.probeContentType(file);
                if (contentType == null) {
                    contentType = blockType == AulaBlockType.IMAGE ? "image/png" : "video/mp4";
                }
                var resource = courseResourceRepository.save(new CourseResource(contentType, file.getFileName().toString(), bytes));
                block.assignResource(resource);
            }
            order++;
        }
        courseItemRepository.deleteAllForCourseExceptPaths(course.getId(), keepPaths);
        course.touch();
    }

    private static String stringValue(Object value) {
        return value == null ? null : value.toString();
    }

    private void cloneShallow(String remoteUrl, String branch, Path target) throws IOException, InterruptedException {
        var process = new ProcessBuilder("git", "clone", "--depth", "1", "--branch", branch, remoteUrl, target.toString())
                                                                                                                          .redirectErrorStream(true)
                                                                                                                          .start();
        var output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (process.waitFor() != 0) {
            throw new IOException(output.isBlank() ? "git clone failed" : output);
        }
    }

    private String readHeadSha(Path repoDir) throws IOException, InterruptedException {
        var process = new ProcessBuilder("git", "rev-parse", "HEAD").directory(repoDir.toFile())
                                                                    .redirectErrorStream(true)
                                                                    .start();
        var output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
        if (process.waitFor() != 0) {
            throw new IOException("Unable to read HEAD sha");
        }
        return output;
    }

    private void deleteRecursive(Path root) {
        try (var walk = Files.walk(root)) {
            walk.sorted((a, b) -> b.compareTo(a)).forEach(path -> {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // best effort cleanup
                }
            });
        } catch (IOException ignored) {
            // best effort cleanup
        }
    }
}
