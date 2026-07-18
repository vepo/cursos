package dev.vepo.cursos.progress;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import dev.vepo.cursos.course.CourseItemRepository;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.enrollment.Enrollment;
import dev.vepo.cursos.enrollment.EnrollmentService;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.study.StudyService;

@ApplicationScoped
public class ProgressService {

    private final ItemProgressRepository itemProgressRepository;
    private final CourseItemRepository courseItemRepository;
    private final EnrollmentService enrollmentService;
    private final CourseService courseService;
    private final StudyService studyService;

    @Inject
    public ProgressService(ItemProgressRepository itemProgressRepository,
                           CourseItemRepository courseItemRepository,
                           EnrollmentService enrollmentService,
                           CourseService courseService,
                           StudyService studyService) {
        this.itemProgressRepository = itemProgressRepository;
        this.courseItemRepository = courseItemRepository;
        this.enrollmentService = enrollmentService;
        this.courseService = courseService;
        this.studyService = studyService;
    }

    @Transactional
    public ItemProgress updateItemProgress(long courseId, long itemId, UpdateProgressRequest request, PassportUser actor) {
        var course = courseService.require(courseId);
        var item = courseService.requireItemOfCourse(courseId, itemId);
        boolean teacher = course.isTaughtBy(actor.id());
        long studentId;
        if (teacher && request.studentPassportUserId() != null) {
            studentId = request.studentPassportUserId();
        } else if (request.studentPassportUserId() != null && request.studentPassportUserId() != actor.id()) {
            throw CursosException.forbidden("Students may only update their own progress");
        } else {
            studentId = actor.id();
        }
        var enrollment = enrollmentService.requireEnrolledStudent(courseId, studentId);
        if (!teacher && !enrollment.belongsTo(actor.id())) {
            throw CursosException.forbidden("Not allowed to update this progress");
        }
        if (!teacher) {
            studyService.ensureAccessible(enrollment, item);
        }
        var existing = itemProgressRepository.findByEnrollmentAndItem(enrollment.getId(), itemId);
        if (existing.isPresent()) {
            existing.get().record(Boolean.TRUE.equals(request.completed()), actor.id());
            return existing.get();
        }
        return itemProgressRepository.save(new ItemProgress(enrollment, item, Boolean.TRUE.equals(request.completed()), actor.id()));
    }

    public ProgressSummaryResponse summaryForEnrollment(long enrollmentId, PassportUser viewer) {
        var enrollment = enrollmentService.require(enrollmentId);
        var course = enrollment.getCourse();
        boolean teacher = course.isTaughtBy(viewer.id());
        boolean self = enrollment.belongsTo(viewer.id());
        if (!teacher && !self) {
            throw CursosException.forbidden("Not allowed to view this progress");
        }
        if (enrollment.getStatus() != EnrollmentStatus.ENROLLED && !teacher) {
            throw CursosException.forbidden("Enrollment is not active");
        }
        return buildSummary(enrollment);
    }

    public List<ProgressSummaryResponse> summariesForCourse(long courseId, PassportUser teacher) {
        courseService.requireTaughtBy(courseId, teacher);
        return enrollmentService.listForCourse(courseId, teacher)
                                .stream()
                                .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED)
                                .map(this::buildSummary)
                                .toList();
    }

    private ProgressSummaryResponse buildSummary(Enrollment enrollment) {
        var items = courseItemRepository.listByCourse(enrollment.getCourse().getId());
        var progressByItem = new HashMap<Long, ItemProgress>();
        for (var progress : itemProgressRepository.listByEnrollment(enrollment.getId())) {
            progressByItem.put(progress.getCourseItem().getId(), progress);
        }
        var itemResponses = new ArrayList<ItemProgressResponse>();
        int completed = 0;
        for (var item : items) {
            var progress = progressByItem.get(item.getId());
            if (progress != null && progress.isCompleted()) {
                completed++;
                itemResponses.add(ItemProgressResponse.load(progress));
            } else if (progress != null) {
                itemResponses.add(ItemProgressResponse.load(progress));
            } else {
                itemResponses.add(new ItemProgressResponse(item.getId(), false, 0L, null));
            }
        }
        double percent = items.isEmpty() ? 0.0 : (completed * 100.0) / items.size();
        return new ProgressSummaryResponse(enrollment.getId(),
                                           enrollment.getCourse().getId(),
                                           enrollment.getStudentPassportUserId(),
                                           enrollment.getStudentName(),
                                           items.size(),
                                           completed,
                                           percent,
                                           itemResponses);
    }
}
