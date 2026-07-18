package dev.vepo.cursos.course;

import java.util.HashSet;
import java.util.List;

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

    @Inject
    public CourseService(CourseRepository courseRepository,
                         CategoryRepository categoryRepository,
                         CourseItemRepository courseItemRepository,
                         CourseResourceRepository courseResourceRepository) {
        this.courseRepository = courseRepository;
        this.categoryRepository = categoryRepository;
        this.courseItemRepository = courseItemRepository;
        this.courseResourceRepository = courseResourceRepository;
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
    public CourseItem addMediaItem(long courseId, String title, CourseItemType type, String contentType, String filename, byte[] content,
                                   PassportUser teacher) {
        if (type != CourseItemType.IMAGE && type != CourseItemType.VIDEO) {
            throw CursosException.badRequest("Media item type must be IMAGE or VIDEO");
        }
        if (content == null || content.length == 0) {
            throw CursosException.badRequest("Media content is required");
        }
        if (content.length > 12 * 1024 * 1024) {
            throw CursosException.badRequest("Media exceeds 12MB limit");
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
        if (itemIds.size() != items.size() || !items.stream().map(CourseItem::getId).allMatch(itemIds::contains)) {
            throw CursosException.badRequest("Reorder list must include every course item exactly once");
        }
        for (int i = 0; i < itemIds.size(); i++) {
            var id = itemIds.get(i);
            var item = items.stream().filter(it -> it.getId().equals(id)).findFirst().orElseThrow();
            item.reorder(i);
        }
        return courseItemRepository.listByCourse(courseId);
    }

    public CourseItem requireItem(long itemId) {
        return courseItemRepository.findById(itemId).orElseThrow(() -> CursosException.notFound("Course item not found: %d".formatted(itemId)));
    }

    public CourseResource requireResource(long resourceId) {
        return courseResourceRepository.findById(resourceId)
                                       .orElseThrow(() -> CursosException.notFound("Course resource not found: %d".formatted(resourceId)));
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
