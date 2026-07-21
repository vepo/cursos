package dev.vepo.cursos.course;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;

import dev.vepo.cursos.category.CategoryRepository;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CourseService {

    private final CourseRepository courseRepository;
    private final CategoryRepository categoryRepository;
    private final CourseItemRepository courseItemRepository;
    private final AulaBlockRepository aulaBlockRepository;
    private final CourseResourceRepository courseResourceRepository;
    private final MediaProperties mediaProperties;

    @Inject
    public CourseService(CourseRepository courseRepository,
                         CategoryRepository categoryRepository,
                         CourseItemRepository courseItemRepository,
                         AulaBlockRepository aulaBlockRepository,
                         CourseResourceRepository courseResourceRepository,
                         MediaProperties mediaProperties) {
        this.courseRepository = courseRepository;
        this.categoryRepository = categoryRepository;
        this.courseItemRepository = courseItemRepository;
        this.aulaBlockRepository = aulaBlockRepository;
        this.courseResourceRepository = courseResourceRepository;
        this.mediaProperties = mediaProperties;
    }

    public Course require(long id) {
        return courseRepository.findById(id).orElseThrow(() -> CursosException.notFound("Course not found: %d".formatted(id)));
    }

    public Course requireTaughtBy(long courseId, PassportUser teacher) {
        var course = require(courseId);
        if (!course.isTaughtBy(teacher.id())) {
            throw CursosException.forbidden("Only the course teacher may perform this action");
        }
        return course;
    }

    @Transactional
    public Course create(CreateCourseRequest request, PassportUser teacher) {
        var course = new Course(request.title().trim(), request.summary(), teacher);
        applyCategories(course, request.categoryIds());
        return courseRepository.save(course);
    }

    @Transactional
    public Course update(long courseId, UpdateCourseRequest request, PassportUser teacher) {
        var course = requireTaughtBy(courseId, teacher);
        course.updateDetails(request.title().trim(), request.summary());
        applyCategories(course, request.categoryIds());
        return course;
    }

    @Transactional
    public Course publish(long courseId, PassportUser teacher) {
        var course = requireTaughtBy(courseId, teacher);
        var items = courseItemRepository.listByCourse(courseId);
        for (var item : items) {
            if (aulaBlockRepository.countByItem(item.getId()) < 1) {
                throw CursosException.badRequest("Every aula must have at least one block before publish");
            }
        }
        course.publish();
        return course;
    }

    @Transactional
    public Course unpublish(long courseId, PassportUser teacher) {
        var course = requireTaughtBy(courseId, teacher);
        course.unpublish();
        return course;
    }

    public List<CourseItem> listItems(long courseId) {
        return courseItemRepository.listByCourse(courseId);
    }

    public List<AulaBlock> listBlocks(long courseItemId) {
        return aulaBlockRepository.listByItem(courseItemId);
    }

    public CourseItemResponse toItemResponse(CourseItem item) {
        return CourseItemResponse.load(item, aulaBlockRepository.listByItem(item.getId()));
    }

    @Transactional
    public CourseItem addMarkdownItem(long courseId, String title, String markdownBody, PassportUser teacher) {
        var course = requireTaughtBy(courseId, teacher);
        var order = courseItemRepository.countByCourse(courseId);
        var item = courseItemRepository.save(new CourseItem(course, title.trim(), order));
        var block = new AulaBlock(item, AulaBlockType.MARKDOWN, 0);
        block.updateMarkdown(markdownBody != null ? markdownBody : "");
        aulaBlockRepository.save(block);
        course.touch();
        return item;
    }

    @Transactional
    public CourseItem addLinkItem(long courseId, String title, String linkUrl, String linkDescription, PassportUser teacher) {
        var course = requireTaughtBy(courseId, teacher);
        var safeUrl = LinkUrlValidator.requireSafeAbsoluteUrl(linkUrl);
        var order = courseItemRepository.countByCourse(courseId);
        var item = courseItemRepository.save(new CourseItem(course, title.trim(), order));
        var block = new AulaBlock(item, AulaBlockType.LINK, 0);
        block.updateLink(safeUrl, linkDescription);
        aulaBlockRepository.save(block);
        course.touch();
        return item;
    }

    @Transactional
    public CourseItem addMediaItem(long courseId, String title, AulaBlockType type, String contentType, String filename, byte[] content,
                                   PassportUser teacher) {
        if (type != AulaBlockType.IMAGE && type != AulaBlockType.VIDEO) {
            throw CursosException.badRequest("Media block type must be IMAGE or VIDEO");
        }
        if (title == null || title.isBlank() || title.trim().length() > 200) {
            throw CursosException.badRequest("Media title is required and must be at most 200 characters");
        }
        validateMediaFile(type, contentType, filename, content);
        var course = requireTaughtBy(courseId, teacher);
        var resource = courseResourceRepository.save(new CourseResource(contentType, filename, content));
        var order = courseItemRepository.countByCourse(courseId);
        var item = courseItemRepository.save(new CourseItem(course, title.trim(), order));
        var block = new AulaBlock(item, type, 0);
        block.assignResource(resource);
        aulaBlockRepository.save(block);
        course.touch();
        return item;
    }

    @Transactional
    public CourseItem updateItemTitle(long courseId, long itemId, String title, PassportUser teacher) {
        var item = requireItemOfCourse(courseId, itemId);
        requireTaughtBy(courseId, teacher);
        item.updateTitle(title.trim());
        item.getCourse().touch();
        return item;
    }

    @Transactional
    public CourseItem updateMarkdownItem(long itemId, String title, String markdownBody, PassportUser teacher) {
        var item = requireItem(itemId);
        requireTaughtBy(item.getCourse().getId(), teacher);
        var block = requireFirstBlockOfType(itemId, AulaBlockType.MARKDOWN);
        item.updateTitle(title.trim());
        block.updateMarkdown(markdownBody != null ? markdownBody : "");
        item.getCourse().touch();
        return item;
    }

    @Transactional
    public CourseItem updateLinkItem(long itemId, String title, String linkUrl, String linkDescription, PassportUser teacher) {
        var item = requireItem(itemId);
        requireTaughtBy(item.getCourse().getId(), teacher);
        var block = requireFirstBlockOfType(itemId, AulaBlockType.LINK);
        item.updateTitle(title.trim());
        block.updateLink(LinkUrlValidator.requireSafeAbsoluteUrl(linkUrl), linkDescription);
        item.getCourse().touch();
        return item;
    }

    @Transactional
    public AulaBlock appendMarkdownBlock(long courseId, long itemId, String markdownBody, PassportUser teacher) {
        var item = requireItemOfCourse(courseId, itemId);
        requireTaughtBy(courseId, teacher);
        var block = new AulaBlock(item, AulaBlockType.MARKDOWN, (int) aulaBlockRepository.countByItem(itemId));
        block.updateMarkdown(markdownBody != null ? markdownBody : "");
        aulaBlockRepository.save(block);
        item.getCourse().touch();
        return block;
    }

    @Transactional
    public AulaBlock appendLinkBlock(long courseId, long itemId, String linkUrl, String linkDescription, PassportUser teacher) {
        var item = requireItemOfCourse(courseId, itemId);
        requireTaughtBy(courseId, teacher);
        var block = new AulaBlock(item, AulaBlockType.LINK, (int) aulaBlockRepository.countByItem(itemId));
        block.updateLink(LinkUrlValidator.requireSafeAbsoluteUrl(linkUrl), linkDescription);
        aulaBlockRepository.save(block);
        item.getCourse().touch();
        return block;
    }

    @Transactional
    public AulaBlock appendMediaBlock(long courseId, long itemId, AulaBlockType type, String contentType, String filename, byte[] content,
                                      PassportUser teacher) {
        if (type != AulaBlockType.IMAGE && type != AulaBlockType.VIDEO) {
            throw CursosException.badRequest("Media block type must be IMAGE or VIDEO");
        }
        validateMediaFile(type, contentType, filename, content);
        var item = requireItemOfCourse(courseId, itemId);
        requireTaughtBy(courseId, teacher);
        var resource = courseResourceRepository.save(new CourseResource(contentType, filename, content));
        var block = new AulaBlock(item, type, (int) aulaBlockRepository.countByItem(itemId));
        block.assignResource(resource);
        aulaBlockRepository.save(block);
        item.getCourse().touch();
        return block;
    }

    @Transactional
    public AulaBlock updateMarkdownBlock(long courseId, long itemId, long blockId, String markdownBody, PassportUser teacher) {
        requireTaughtBy(courseId, teacher);
        var block = requireBlockOfItem(courseId, itemId, blockId);
        if (block.getBlockType() != AulaBlockType.MARKDOWN) {
            throw CursosException.badRequest("Block is not markdown");
        }
        block.updateMarkdown(markdownBody != null ? markdownBody : "");
        block.getCourseItem().getCourse().touch();
        return block;
    }

    @Transactional
    public AulaBlock updateLinkBlock(long courseId, long itemId, long blockId, String linkUrl, String linkDescription, PassportUser teacher) {
        requireTaughtBy(courseId, teacher);
        var block = requireBlockOfItem(courseId, itemId, blockId);
        if (block.getBlockType() != AulaBlockType.LINK) {
            throw CursosException.badRequest("Block is not a link");
        }
        block.updateLink(LinkUrlValidator.requireSafeAbsoluteUrl(linkUrl), linkDescription);
        block.getCourseItem().getCourse().touch();
        return block;
    }

    @Transactional
    public void deleteBlock(long courseId, long itemId, long blockId, PassportUser teacher) {
        requireTaughtBy(courseId, teacher);
        var block = requireBlockOfItem(courseId, itemId, blockId);
        if (aulaBlockRepository.countByItem(itemId) <= 1) {
            throw CursosException.badRequest("Cannot delete the last block of an aula");
        }
        aulaBlockRepository.delete(block);
        block.getCourseItem().getCourse().touch();
        reindexBlocks(itemId);
    }

    @Transactional
    public List<AulaBlock> reorderBlocks(long courseId, long itemId, List<Long> blockIds, PassportUser teacher) {
        requireTaughtBy(courseId, teacher);
        requireItemOfCourse(courseId, itemId);
        var blocks = aulaBlockRepository.listByItem(itemId);
        if (blockIds == null || blockIds.isEmpty()) {
            throw CursosException.badRequest("Reorder list must include every block exactly once");
        }
        var distinctIds = blockIds.stream().distinct().toList();
        if (distinctIds.size() != blockIds.size()) {
            throw CursosException.badRequest("Reorder list must not contain duplicate block ids");
        }
        var existingIds = blocks.stream().map(AulaBlock::getId).collect(java.util.stream.Collectors.toSet());
        if (blockIds.size() != blocks.size() || !existingIds.containsAll(blockIds)) {
            throw CursosException.badRequest("Reorder list must include every block exactly once");
        }
        for (int i = 0; i < blocks.size(); i++) {
            blocks.get(i).reorder(-(i + 1));
        }
        aulaBlockRepository.flush();
        var byId = blocks.stream().collect(java.util.stream.Collectors.toMap(AulaBlock::getId, block -> block));
        for (int i = 0; i < blockIds.size(); i++) {
            byId.get(blockIds.get(i)).reorder(i);
        }
        return aulaBlockRepository.listByItem(itemId);
    }

    @Transactional
    public void deleteItem(long itemId, PassportUser teacher) {
        var item = requireItem(itemId);
        requireTaughtBy(item.getCourse().getId(), teacher);
        courseItemRepository.delete(item);
        item.getCourse().touch();
    }

    @Transactional
    public List<CourseItem> reorder(long courseId, List<Long> itemIds, PassportUser teacher) {
        requireTaughtBy(courseId, teacher);
        var items = courseItemRepository.listByCourse(courseId);
        if (itemIds == null || itemIds.isEmpty()) {
            throw CursosException.badRequest("Reorder list must include every course item exactly once");
        }
        var distinctIds = itemIds.stream().distinct().toList();
        if (distinctIds.size() != itemIds.size()) {
            throw CursosException.badRequest("Reorder list must not contain duplicate item ids");
        }
        var existingIds = items.stream().map(CourseItem::getId).collect(java.util.stream.Collectors.toSet());
        if (itemIds.size() != items.size() || !existingIds.containsAll(itemIds)) {
            throw CursosException.badRequest("Reorder list must include every course item exactly once");
        }
        for (int i = 0; i < items.size(); i++) {
            items.get(i).reorder(-(i + 1));
        }
        courseItemRepository.flush();
        var byId = items.stream().collect(java.util.stream.Collectors.toMap(CourseItem::getId, item -> item));
        for (int i = 0; i < itemIds.size(); i++) {
            byId.get(itemIds.get(i)).reorder(i);
        }
        return courseItemRepository.listByCourse(courseId);
    }

    public CourseItem requireItem(long itemId) {
        return courseItemRepository.findById(itemId).orElseThrow(() -> CursosException.notFound("Course item not found: %d".formatted(itemId)));
    }

    public CourseItem requireItemOfCourse(long courseId, long itemId) {
        var item = requireItem(itemId);
        if (!item.getCourse().getId().equals(courseId)) {
            throw CursosException.badRequest("Item does not belong to course");
        }
        return item;
    }

    public CourseResource requireResource(long resourceId) {
        return courseResourceRepository.findById(resourceId)
                                       .orElseThrow(() -> CursosException.notFound("Course resource not found: %d".formatted(resourceId)));
    }

    public CourseResource requireResourceOfCourse(long courseId, long resourceId) {
        return courseResourceRepository.findByCourseAndResourceId(courseId, resourceId)
                                       .orElseThrow(() -> CursosException.notFound("Course resource not found: %d".formatted(resourceId)));
    }

    public CourseItem requireVideoItem(long courseId, long itemId, long resourceId) {
        var item = requireItemOfCourse(courseId, itemId);
        var match = aulaBlockRepository.listByItem(itemId)
                                       .stream()
                                       .filter(block -> block.getBlockType() == AulaBlockType.VIDEO)
                                       .filter(block -> block.getResource() != null && block.getResource().getId().equals(resourceId))
                                       .findFirst();
        if (match.isEmpty()) {
            throw CursosException.badRequest("Resource does not belong to a video block on this aula");
        }
        return item;
    }

    private AulaBlock requireFirstBlockOfType(long itemId, AulaBlockType type) {
        return aulaBlockRepository.listByItem(itemId)
                                  .stream()
                                  .filter(block -> block.getBlockType() == type)
                                  .findFirst()
                                  .orElseThrow(() -> CursosException.badRequest("Aula has no %s block".formatted(type.name().toLowerCase(Locale.ROOT))));
    }

    private AulaBlock requireBlockOfItem(long courseId, long itemId, long blockId) {
        requireItemOfCourse(courseId, itemId);
        var block = aulaBlockRepository.findById(blockId)
                                       .orElseThrow(() -> CursosException.notFound("Aula block not found: %d".formatted(blockId)));
        if (!block.getCourseItem().getId().equals(itemId)) {
            throw CursosException.badRequest("Block does not belong to aula");
        }
        return block;
    }

    private void reindexBlocks(long itemId) {
        var blocks = aulaBlockRepository.listByItem(itemId);
        for (int i = 0; i < blocks.size(); i++) {
            blocks.get(i).reorder(-(i + 1));
        }
        aulaBlockRepository.flush();
        for (int i = 0; i < blocks.size(); i++) {
            blocks.get(i).reorder(i);
        }
    }

    private void validateMediaFile(AulaBlockType type, String contentType, String filename, byte[] content) {
        if (filename == null || filename.isBlank() || filename.length() > 255) {
            throw CursosException.badRequest("Filename is required and must be at most 255 characters");
        }
        if (content == null || content.length == 0) {
            throw CursosException.badRequest("Media content is required");
        }
        var normalizedType = contentType != null ? contentType.toLowerCase(Locale.ROOT) : "";
        if (type == AulaBlockType.IMAGE && !normalizedType.startsWith("image/")) {
            throw CursosException.badRequest("IMAGE content type must be image/*");
        }
        if (type == AulaBlockType.VIDEO && !normalizedType.startsWith("video/")) {
            throw CursosException.badRequest("VIDEO content type must be video/*");
        }
        var maxBytes = type == AulaBlockType.VIDEO ? mediaProperties.maxVideoBytes() : mediaProperties.maxImageBytes();
        if (content.length > maxBytes) {
            throw CursosException.badRequest("Media exceeds configured size limit");
        }
    }

    private void applyCategories(Course course, List<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            course.replaceCategories(new HashSet<>());
            return;
        }
        var categories = categoryRepository.findByIds(categoryIds);
        if (categories.size() != categoryIds.stream().distinct().count()) {
            throw CursosException.badRequest("One or more categories were not found");
        }
        course.replaceCategories(new HashSet<>(categories));
    }
}
