package dev.vepo.cursos.study;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import dev.vepo.cursos.course.CourseItem;
import dev.vepo.cursos.course.CourseItemRepository;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.enrollment.Enrollment;
import dev.vepo.cursos.enrollment.EnrollmentService;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.progress.ItemProgressRepository;

@ApplicationScoped
public class StudyService {

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final CourseItemRepository courseItemRepository;
    private final ItemProgressRepository itemProgressRepository;

    @Inject
    public StudyService(CourseService courseService,
                        EnrollmentService enrollmentService,
                        CourseItemRepository courseItemRepository,
                        ItemProgressRepository itemProgressRepository) {
        this.courseService = courseService;
        this.enrollmentService = enrollmentService;
        this.courseItemRepository = courseItemRepository;
        this.itemProgressRepository = itemProgressRepository;
    }

    public StudyResponse studyTree(long courseId, PassportUser viewer) {
        var course = courseService.require(courseId);
        boolean teacher = course.isTaughtBy(viewer.id());
        Enrollment enrollment = null;
        Set<Long> completedItemIds = Set.of();
        if (!teacher) {
            enrollment = enrollmentService.requireEnrolledStudent(courseId, viewer.id());
            completedItemIds = completedItemIds(enrollment);
        }
        var courseItems = courseItemRepository.listByCourse(courseId);
        var items = new ArrayList<StudyItemResponse>();
        boolean allPreviousCompleted = true;
        int completedCount = 0;
        for (var item : courseItems) {
            boolean completed = completedItemIds.contains(item.getId());
            if (completed) {
                completedCount++;
            }
            items.add(new StudyItemResponse(item.getId(),
                                            item.getTitle(),
                                            item.getSortOrder(),
                                            completed,
                                            teacher || allPreviousCompleted));
            allPreviousCompleted = allPreviousCompleted && completed;
        }
        int total = courseItems.size();
        double percent = total == 0 ? 0.0 : (completedCount * 100.0) / total;
        boolean concluded = enrollment != null && enrollment.isConcluded() && total > 0 && completedCount == total;
        return new StudyResponse(courseId,
                                 items,
                                 completedCount,
                                 total,
                                 percent,
                                 concluded,
                                 enrollment != null ? enrollment.getConcludedAt() : null);
    }

    public CourseItem requireAccessibleItem(long courseId, long itemId, PassportUser viewer) {
        var course = courseService.require(courseId);
        var item = courseService.requireItemOfCourse(courseId, itemId);
        if (course.isTaughtBy(viewer.id())) {
            return item;
        }
        var enrollment = enrollmentService.requireEnrolledStudent(courseId, viewer.id());
        ensureAccessible(enrollment, item);
        return item;
    }

    public void ensureAccessible(Enrollment enrollment, CourseItem item) {
        var completedItemIds = completedItemIds(enrollment);
        boolean previousCompleted = courseItemRepository.listByCourse(item.getCourse().getId())
                                                        .stream()
                                                        .filter(previous -> previous.getSortOrder() < item.getSortOrder())
                                                        .allMatch(previous -> completedItemIds.contains(previous.getId()));
        if (!previousCompleted) {
            throw CursosException.forbidden("Aula is locked until all previous aulas are completed");
        }
    }

    private Set<Long> completedItemIds(Enrollment enrollment) {
        var completedItemIds = new HashSet<Long>();
        for (var progress : itemProgressRepository.listByEnrollment(enrollment.getId())) {
            if (progress.isCompleted()) {
                completedItemIds.add(progress.getCourseItem().getId());
            }
        }
        return completedItemIds;
    }
}
