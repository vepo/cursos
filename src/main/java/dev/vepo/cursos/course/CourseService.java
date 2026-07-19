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
    private final CourseResourceRepository courseResourceRepository;
    private final MediaProperties mediaProperties;

    @Inject
    public CourseService(CourseRepository courseRepository,
                         CategoryRepository categoryRepository,
                         CourseItemRepository courseItemRepository,
                         CourseResourceRepository courseResourceRepository,
                         MediaProperties mediaProperties) {
        this.courseRepository = courseRepository;
        this.categoryRepository = categoryRepository;
        this.courseItemRepository = courseItemRepository;
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

    @Transactional
    public CourseItem addMarkdownItem(long courseId, String title, String markdownBody, PassportUser teacher) {
        var course = requireTaughtBy(courseId, teacher);
        var order = courseItemRepository.countByCourse(courseId);
        var item = new CourseItem(course, title.trim(), CourseItemType.MARKDOWN, order);
        item.updateMarkdown(markdownBody != null ? markdownBody : "");
        course.touch();
        return courseItemRepository.save(item);
    }

    @Transactional
    public CourseItem addLinkItem(long courseId, String title, String linkUrl, String linkDescription, PassportUser teacher) {
        var course = requireTaughtBy(courseId, teacher);
        var safeUrl = LinkUrlValidator.requireSafeAbsoluteUrl(linkUrl);
        var order = courseItemRepository.countByCourse(courseId);
        var item = new CourseItem(course, title.trim(), CourseItemType.LINK, order);
        item.updateLink(safeUrl, linkDescription);
        course.touch();
        return courseItemRepository.save(item);
    }

    @Transactional
    public CourseItem addMediaItem(long courseId, String title, CourseItemType type, String contentType, String filename, byte[] content,
                                   PassportUser teacher) {
        if (type != CourseItemType.IMAGE && type != CourseItemType.VIDEO) {
            throw CursosException.badRequest("Media item type must be IMAGE or VIDEO");
        }
        if (title == null || title.isBlank() || title.trim().length() > 200) {
            throw CursosException.badRequest("Media title is required and must be at most 200 characters");
        }
        if (filename == null || filename.isBlank() || filename.length() > 255) {
            throw CursosException.badRequest("Filename is required and must be at most 255 characters");
        }
        if (content == null || content.length == 0) {
            throw CursosException.badRequest("Media content is required");
        }
        var normalizedType = contentType != null ? contentType.toLowerCase(Locale.ROOT) : "";
        if (type == CourseItemType.IMAGE && !normalizedType.startsWith("image/")) {
            throw CursosException.badRequest("IMAGE content type must be image/*");
        }
        if (type == CourseItemType.VIDEO && !normalizedType.startsWith("video/")) {
            throw CursosException.badRequest("VIDEO content type must be video/*");
        }
        var maxBytes = type == CourseItemType.VIDEO ? mediaProperties.maxVideoBytes() : mediaProperties.maxImageBytes();
        if (content.length > maxBytes) {
            throw CursosException.badRequest("Media exceeds configured size limit");
        }
        var course = requireTaughtBy(courseId, teacher);
        var resource = courseResourceRepository.save(new CourseResource(contentType, filename, content));
        var order = courseItemRepository.countByCourse(courseId);
        var item = new CourseItem(course, title.trim(), type, order);
        item.assignResource(resource);
        course.touch();
        return courseItemRepository.save(item);
    }

    @Transactional
    public CourseItem updateMarkdownItem(long itemId, String title, String markdownBody, PassportUser teacher) {
        var item = requireItem(itemId);
        requireTaughtBy(item.getCourse().getId(), teacher);
        if (item.getItemType() != CourseItemType.MARKDOWN) {
            throw CursosException.badRequest("Item is not markdown");
        }
        item.updateTitle(title.trim());
        item.updateMarkdown(markdownBody != null ? markdownBody : "");
        item.getCourse().touch();
        return item;
    }

    @Transactional
    public CourseItem updateLinkItem(long itemId, String title, String linkUrl, String linkDescription, PassportUser teacher) {
        var item = requireItem(itemId);
        requireTaughtBy(item.getCourse().getId(), teacher);
        if (item.getItemType() != CourseItemType.LINK) {
            throw CursosException.badRequest("Item is not a link aula");
        }
        item.updateTitle(title.trim());
        item.updateLink(LinkUrlValidator.requireSafeAbsoluteUrl(linkUrl), linkDescription);
        item.getCourse().touch();
        return item;
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
        // Two-phase update avoids unique (course_id, sort_order) collisions on adjacent
        // swaps.
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
        if (item.getItemType() != CourseItemType.VIDEO) {
            throw CursosException.badRequest("Item is not a video aula");
        }
        if (item.getResource() == null || !item.getResource().getId().equals(resourceId)) {
            throw CursosException.badRequest("Resource does not belong to course item");
        }
        return item;
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
