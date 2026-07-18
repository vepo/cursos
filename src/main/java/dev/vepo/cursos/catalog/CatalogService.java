package dev.vepo.cursos.catalog;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Locale;
import java.util.stream.Stream;

import dev.vepo.cursos.course.CourseRepository;
import dev.vepo.cursos.enrollment.EnrollmentRepository;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.AuthorProfileService;
import dev.vepo.cursos.identity.PassportUser;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CatalogService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AuthorProfileService authorProfileService;

    @Inject
    public CatalogService(CourseRepository courseRepository,
                          EnrollmentRepository enrollmentRepository,
                          AuthorProfileService authorProfileService) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.authorProfileService = authorProfileService;
    }

    public CatalogResponse loadCatalog(PassportUser user, String categorySlug, String authorization) {
        var teaching = new ArrayList<CatalogCourseResponse>();
        var enrolled = new ArrayList<CatalogCourseResponse>();
        var available = new ArrayList<CatalogCourseResponse>();

        var taughtIds = new HashSet<Long>();
        var taughtCourses = courseRepository.listTaughtBy(user.id());
        for (var course : taughtCourses) {
            if (!matchesCategory(course, categorySlug)) {
                continue;
            }
            taughtIds.add(course.getId());
        }

        var enrollmentByCourse = new java.util.HashMap<Long, EnrollmentStatus>();
        for (var enrollment : enrollmentRepository.listByStudent(user.id())) {
            enrollmentByCourse.put(enrollment.getCourse().getId(), enrollment.getStatus());
        }

        var published = courseRepository.listPublished();
        var teacherIds = Stream.concat(taughtCourses.stream(), published.stream())
                               .map(c -> c.getTeacherPassportUserId())
                               .collect(java.util.stream.Collectors.toSet());
        var authors = authorProfileService.lookup(authorization, teacherIds);

        for (var course : taughtCourses) {
            if (!matchesCategory(course, categorySlug)) {
                continue;
            }
            teaching.add(CatalogCourseResponse.load(course, true, null, "teaching", authors.get(course.getTeacherPassportUserId())));
        }

        for (var enrollment : enrollmentRepository.listByStudent(user.id())) {
            if (taughtIds.contains(enrollment.getCourse().getId())) {
                continue;
            }
            if (!matchesCategory(enrollment.getCourse(), categorySlug)) {
                continue;
            }
            if (enrollment.getStatus() == EnrollmentStatus.ENROLLED || enrollment.getStatus() == EnrollmentStatus.REQUESTED) {
                enrolled.add(CatalogCourseResponse.load(enrollment.getCourse(),
                                                        false,
                                                        enrollment.getStatus(),
                                                        enrollment.getStatus() == EnrollmentStatus.ENROLLED ? "enrolled" : "requested",
                                                        authors.get(enrollment.getCourse().getTeacherPassportUserId())));
            }
        }

        for (var course : published) {
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
            available.add(CatalogCourseResponse.load(course, false, status, "available", authors.get(course.getTeacherPassportUserId())));
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
