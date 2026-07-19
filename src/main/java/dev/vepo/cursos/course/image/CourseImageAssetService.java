package dev.vepo.cursos.course.image;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.course.CourseItemRepository;
import dev.vepo.cursos.course.CourseItemType;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.course.MediaProperties;
import dev.vepo.cursos.enrollment.EnrollmentRepository;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CourseImageAssetService {

    private static final Set<String> ALLOWED_MIME = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    private static final Pattern COURSE_ASSET_REF = Pattern.compile("!\\[[^\\]]*\\]\\(course-asset:(\\d+)\\)");
    private static final int MAX_FILENAME_LENGTH = 255;

    private final CourseService courseService;
    private final CourseImageAssetRepository courseImageAssetRepository;
    private final CourseItemRepository courseItemRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ImageTicketService imageTicketService;
    private final MediaProperties mediaProperties;

    @Inject
    public CourseImageAssetService(CourseService courseService,
                                   CourseImageAssetRepository courseImageAssetRepository,
                                   CourseItemRepository courseItemRepository,
                                   EnrollmentRepository enrollmentRepository,
                                   ImageTicketService imageTicketService,
                                   MediaProperties mediaProperties) {
        this.courseService = courseService;
        this.courseImageAssetRepository = courseImageAssetRepository;
        this.courseItemRepository = courseItemRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.imageTicketService = imageTicketService;
        this.mediaProperties = mediaProperties;
    }

    @Transactional
    public CourseImageAsset upload(long courseId, String contentType, String filename, byte[] content, PassportUser teacher) {
        var course = courseService.requireTaughtBy(courseId, teacher);
        validateRaster(contentType, filename, content);
        return courseImageAssetRepository.save(new CourseImageAsset(course, normalizeMime(contentType), sanitizeFilename(filename), content));
    }

    public List<CourseImageAsset> list(long courseId, PassportUser user) {
        requireGalleryAccess(courseId, user);
        return courseImageAssetRepository.listByCourse(courseId);
    }

    @Transactional
    public void delete(long courseId, long assetId, PassportUser teacher) {
        courseService.requireTaughtBy(courseId, teacher);
        var asset = requireAsset(courseId, assetId);
        var course = asset.getCourse();
        if (course.getCoverImageAssetId() != null && course.getCoverImageAssetId().equals(assetId)) {
            throw CursosException.conflict("Cannot delete the course cover image; clear the cover first");
        }
        if (isReferencedInMarkdown(courseId, assetId)) {
            throw CursosException.conflict("Cannot delete an image referenced in Markdown");
        }
        courseImageAssetRepository.delete(asset);
        course.touch();
    }

    @Transactional
    public Course setCover(long courseId, long assetId, PassportUser teacher) {
        var course = courseService.requireTaughtBy(courseId, teacher);
        requireAsset(courseId, assetId);
        course.setCoverImageAssetId(assetId);
        return course;
    }

    @Transactional
    public Course clearCover(long courseId, PassportUser teacher) {
        var course = courseService.requireTaughtBy(courseId, teacher);
        course.clearCoverImageAssetId();
        return course;
    }

    public List<ImageTicketService.ImageTicket> issueTickets(long courseId, List<Long> assetIds, PassportUser user) {
        if (assetIds == null || assetIds.isEmpty()) {
            return List.of();
        }
        var distinct = assetIds.stream().distinct().toList();
        var course = courseService.require(courseId);
        var assets = courseImageAssetRepository.findByCourseAndIds(courseId, distinct);
        if (assets.size() != distinct.size()) {
            throw CursosException.notFound("One or more image assets were not found");
        }
        var coverId = course.getCoverImageAssetId();
        for (var assetId : distinct) {
            if (coverId != null && coverId.equals(assetId)) {
                requireCoverTicketAccess(course, user);
            } else {
                requireGalleryAccess(courseId, user);
            }
        }
        return distinct.stream().map(id -> imageTicketService.issue(courseId, id)).toList();
    }

    public String signedUrlOrNull(Course course) {
        if (course.getCoverImageAssetId() == null) {
            return null;
        }
        return imageTicketService.issue(course.getId(), course.getCoverImageAssetId()).url();
    }

    public CourseImageAsset requireAsset(long courseId, long assetId) {
        return courseImageAssetRepository.findByCourseAndId(courseId, assetId)
                                         .orElseThrow(() -> CursosException.notFound("Course image asset not found: %d".formatted(assetId)));
    }

    public void verifyAndLoad(long courseId, long assetId, long expires, String sig) {
        imageTicketService.verify(courseId, assetId, expires, sig);
        requireAsset(courseId, assetId);
    }

    private void requireGalleryAccess(long courseId, PassportUser user) {
        var course = courseService.require(courseId);
        if (course.isTaughtBy(user.id())) {
            return;
        }
        var enrolled = enrollmentRepository.findByCourseAndStudent(courseId, user.id())
                                           .filter(enrollment -> enrollment.getStatus() == EnrollmentStatus.ENROLLED)
                                           .isPresent();
        if (!enrolled) {
            throw CursosException.forbidden("Only the teacher or enrolled students can access gallery images");
        }
    }

    private void requireCoverTicketAccess(Course course, PassportUser user) {
        if (course.isTaughtBy(user.id())) {
            return;
        }
        if (course.getStatus() == CourseStatus.PUBLISHED) {
            return;
        }
        throw CursosException.forbidden("Cover image is available for teachers or published courses");
    }

    private boolean isReferencedInMarkdown(long courseId, long assetId) {
        var needle = "course-asset:%d".formatted(assetId);
        return courseItemRepository.listByCourse(courseId)
                                   .stream()
                                   .filter(item -> item.getItemType() == CourseItemType.MARKDOWN)
                                   .map(item -> item.getMarkdownBody() == null ? "" : item.getMarkdownBody())
                                   .anyMatch(body -> body.contains(needle));
    }

    public Set<Long> extractReferencedAssetIds(String markdownBody) {
        var ids = new HashSet<Long>();
        if (markdownBody == null || markdownBody.isBlank()) {
            return ids;
        }
        var matcher = COURSE_ASSET_REF.matcher(markdownBody);
        while (matcher.find()) {
            ids.add(Long.parseLong(matcher.group(1)));
        }
        return ids;
    }

    private void validateRaster(String contentType, String filename, byte[] content) {
        if (content == null || content.length == 0) {
            throw CursosException.badRequest("Image file is required");
        }
        if (content.length > mediaProperties.maxImageBytes()) {
            throw CursosException.badRequest("Image exceeds maximum size of %d bytes".formatted(mediaProperties.maxImageBytes()));
        }
        var mime = normalizeMime(contentType);
        if (!ALLOWED_MIME.contains(mime)) {
            throw CursosException.badRequest("Only JPEG, PNG, WebP, and GIF images are allowed");
        }
        if (filename == null || filename.isBlank()) {
            throw CursosException.badRequest("Image filename is required");
        }
        if (filename.length() > MAX_FILENAME_LENGTH) {
            throw CursosException.badRequest("Image filename exceeds %d characters".formatted(MAX_FILENAME_LENGTH));
        }
        if (!matchesMagic(mime, content)) {
            throw CursosException.badRequest("Image content does not match declared type");
        }
    }

    private static String normalizeMime(String contentType) {
        if (contentType == null) {
            return "";
        }
        var mime = contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        if ("image/jpg".equals(mime)) {
            return "image/jpeg";
        }
        return mime;
    }

    private static String sanitizeFilename(String filename) {
        var trimmed = filename.trim();
        var slash = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'));
        return slash >= 0 ? trimmed.substring(slash + 1) : trimmed;
    }

    private static boolean matchesMagic(String mime, byte[] content) {
        if (content.length < 12) {
            return false;
        }
        return switch (mime) {
            case "image/jpeg" -> content[0] == (byte) 0xFF && content[1] == (byte) 0xD8;
            case "image/png" -> content[0] == (byte) 0x89 && content[1] == 0x50 && content[2] == 0x4E && content[3] == 0x47;
            case "image/gif" -> content[0] == 'G' && content[1] == 'I' && content[2] == 'F';
            case "image/webp" -> content[0] == 'R' && content[1] == 'I' && content[2] == 'F' && content[3] == 'F'
                    && content[8] == 'W' && content[9] == 'E' && content[10] == 'B' && content[11] == 'P';
            default -> false;
        };
    }
}
