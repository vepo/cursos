package dev.vepo.cursos.enrollment;

import java.util.List;

import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.mailer.MailerService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseService courseService;
    private final MailerService mailerService;

    @Inject
    public EnrollmentService(EnrollmentRepository enrollmentRepository, CourseService courseService, MailerService mailerService) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseService = courseService;
        this.mailerService = mailerService;
    }

    public Enrollment require(long enrollmentId) {
        return enrollmentRepository.findById(enrollmentId)
                                   .orElseThrow(() -> CursosException.notFound("Enrollment not found: %d".formatted(enrollmentId)));
    }

    @Transactional
    public Enrollment requestEnrollment(long courseId, PassportUser student) {
        var course = courseService.require(courseId);
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw CursosException.badRequest("Only published courses accept enrollment requests");
        }
        if (course.isTaughtBy(student.id())) {
            throw CursosException.badRequest("Teachers cannot enroll in their own course");
        }
        var existing = enrollmentRepository.findByCourseAndStudent(courseId, student.id());
        if (existing.isPresent()) {
            var enrollment = existing.get();
            if (enrollment.getStatus() == EnrollmentStatus.REJECTED) {
                enrollment.reopenAsRequested();
                return enrollment;
            }
            throw CursosException.conflict("Enrollment already exists with status %s".formatted(enrollment.getStatus()));
        }
        return enrollmentRepository.save(new Enrollment(course, student, EnrollmentStatus.REQUESTED));
    }

    @Transactional
    public Enrollment approve(long enrollmentId, PassportUser teacher) {
        var enrollment = require(enrollmentId);
        courseService.requireTaughtBy(enrollment.getCourse().getId(), teacher);
        if (enrollment.getStatus() != EnrollmentStatus.REQUESTED) {
            throw CursosException.badRequest("Only requested enrollments can be approved");
        }
        enrollment.approve();
        return enrollment;
    }

    @Transactional
    public Enrollment reject(long enrollmentId, PassportUser teacher) {
        var enrollment = require(enrollmentId);
        courseService.requireTaughtBy(enrollment.getCourse().getId(), teacher);
        if (enrollment.getStatus() != EnrollmentStatus.REQUESTED) {
            throw CursosException.badRequest("Only requested enrollments can be rejected");
        }
        enrollment.reject();
        return enrollment;
    }

    @Transactional
    public Enrollment directEnroll(long courseId, DirectEnrollRequest request, PassportUser teacher) {
        var course = courseService.requireTaughtBy(courseId, teacher);
        var student = new PassportUser(request.passportUserId(), request.username(), request.name(), request.email());
        var existing = enrollmentRepository.findByCourseAndStudent(courseId, student.id());
        Enrollment enrollment;
        if (existing.isPresent()) {
            enrollment = existing.get();
            enrollment.markEnrolled();
        } else {
            enrollment = enrollmentRepository.save(new Enrollment(course, student, EnrollmentStatus.ENROLLED));
        }
        mailerService.sendEnrollmentInvitation(course, student);
        return enrollment;
    }

    public List<Enrollment> listForCourse(long courseId, PassportUser teacher) {
        courseService.requireTaughtBy(courseId, teacher);
        return enrollmentRepository.listByCourse(courseId);
    }

    public List<Enrollment> listMine(PassportUser student) {
        return enrollmentRepository.listByStudent(student.id());
    }

    public Enrollment requireEnrolledStudent(long courseId, long studentPassportUserId) {
        return enrollmentRepository.findByCourseAndStudent(courseId, studentPassportUserId)
                                   .filter(e -> e.getStatus() == EnrollmentStatus.ENROLLED)
                                   .orElseThrow(() -> CursosException.forbidden("Active enrollment required"));
    }
}
