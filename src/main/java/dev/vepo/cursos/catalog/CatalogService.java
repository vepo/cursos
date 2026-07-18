package dev.vepo.cursos.catalog;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Locale;

import dev.vepo.cursos.course.CourseRepository;
import dev.vepo.cursos.enrollment.EnrollmentRepository;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CatalogService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Inject
    public CatalogService(CourseRepository courseRepository, EnrollmentRepository enrollmentRepository) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    public CatalogResponse loadCatalog(PassportUser user, String categorySlug) {
        var teaching = new ArrayList<CatalogCourseResponse>();
        var enrolled = new ArrayList<CatalogCourseResponse>();
        var available = new ArrayList<CatalogCourseResponse>();

        var taughtIds = new HashSet<Long>();
        for (var course : courseRepository.listTaughtBy(user.id())) {
            if (!matchesCategory(course, categorySlug)) {
                continue;
            }
            taughtIds.add(course.getId());
            teaching.add(CatalogCourseResponse.load(course, true, null, "teaching"));
        }

        var enrollmentByCourse = new java.util.HashMap<Long, EnrollmentStatus>();
        for (var enrollment : enrollmentRepository.listByStudent(user.id())) {
            enrollmentByCourse.put(enrollment.getCourse().getId(), enrollment.getStatus());
            if (taughtIds.contains(enrollment.getCourse().getId())) {
                continue;
            }
            if (!matchesCategory(enrollment.getCourse(), categorySlug)) {
                continue;
            }
            if (enrollment.getStatus() == EnrollmentStatus.ENROLLED || enrollment.getStatus() == EnrollmentStatus.REQUESTED) {
                enrolled.add(CatalogCourseResponse.load(enrollment.getCourse(), false, enrollment.getStatus(),
                                                        enrollment.getStatus() == EnrollmentStatus.ENROLLED ? "enrolled" : "requested"));
            }
        }

        for (var course : courseRepository.listPublished()) {
            if (taughtIds.contains(course.getId())) {
                continue;
            }
            var status = enrollmentByCourse.get(course.getId());
            if (status == EnrollmentStatus.ENROLLED || status == EnrollmentStatus.REQUESTED) {
                continue;
            }
            if (!matchesCategory(course, categorySlug)) {
                continue;
            }
            available.add(CatalogCourseResponse.load(course, false, status, "available"));
        }

        return new CatalogResponse(teaching, enrolled, available);
    }

    private boolean matchesCategory(dev.vepo.cursos.course.Course course, String categorySlug) {
        if (categorySlug == null || categorySlug.isBlank()) {
            return true;
        }
        var slug = categorySlug.toLowerCase(Locale.ROOT);
        return course.getCategories().stream().anyMatch(c -> c.getSlug().equals(slug));
    }
}
