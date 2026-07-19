package dev.vepo.cursos.catalog;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Locale;
import java.util.stream.Stream;

import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.course.CourseRepository;
import dev.vepo.cursos.course.image.CourseImageAssetService;
import dev.vepo.cursos.enrollment.Enrollment;
import dev.vepo.cursos.enrollment.EnrollmentRepository;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.AuthorProfile;
import dev.vepo.cursos.identity.AuthorProfileService;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.progress.EnrollmentProgressProjection;
import dev.vepo.cursos.progress.ProgressService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class CatalogService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AuthorProfileService authorProfileService;
    private final CourseImageAssetService courseImageAssetService;
    private final ProgressService progressService;

    @Inject
    public CatalogService(CourseRepository courseRepository,
                          EnrollmentRepository enrollmentRepository,
                          AuthorProfileService authorProfileService,
                          CourseImageAssetService courseImageAssetService,
                          ProgressService progressService) {
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.authorProfileService = authorProfileService;
        this.courseImageAssetService = courseImageAssetService;
        this.progressService = progressService;
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
            teaching.add(toCatalogCourse(course, true, null, "teaching", authors.get(course.getTeacherPassportUserId()), null));
        }

        for (var enrollment : enrollmentRepository.listByStudent(user.id())) {
            if (taughtIds.contains(enrollment.getCourse().getId())) {
                continue;
            }
            if (!matchesCategory(enrollment.getCourse(), categorySlug)) {
                continue;
            }
            if (enrollment.getStatus() == EnrollmentStatus.ENROLLED || enrollment.getStatus() == EnrollmentStatus.REQUESTED) {
                EnrollmentProgressProjection progress = enrollment.getStatus() == EnrollmentStatus.ENROLLED
                                                                                                            ? progressService.projectionForEnrollment(enrollment)
                                                                                                            : null;
                enrolled.add(toCatalogCourse(enrollment.getCourse(),
                                             false,
                                             enrollment.getStatus(),
                                             enrollment.getStatus() == EnrollmentStatus.ENROLLED ? "enrolled" : "requested",
                                             authors.get(enrollment.getCourse().getTeacherPassportUserId()),
                                             progress));
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
            available.add(toCatalogCourse(course, false, status, "available", authors.get(course.getTeacherPassportUserId()), null));
        }

        return new CatalogResponse(teaching, enrolled, available);
    }

    private CatalogCourseResponse toCatalogCourse(Course course,
                                                  boolean teaching,
                                                  EnrollmentStatus enrollmentStatus,
                                                  String section,
                                                  AuthorProfile author,
                                                  EnrollmentProgressProjection progress) {
        return CatalogCourseResponse.load(course,
                                          teaching,
                                          enrollmentStatus,
                                          section,
                                          author,
                                          courseImageAssetService.signedUrlOrNull(course),
                                          progress);
    }

    private boolean matchesCategory(Course course, String categorySlug) {
        if (categorySlug == null || categorySlug.isBlank()) {
            return true;
        }
        var slug = categorySlug.toLowerCase(Locale.ROOT);
        return course.getCategories().stream().anyMatch(c -> slug.equalsIgnoreCase(c.getSlug()));
    }
}
