package dev.vepo.cursos.catalog;

import java.time.Instant;
import java.util.List;

import dev.vepo.cursos.category.CategoryResponse;
import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.AuthorProfile;
import dev.vepo.cursos.progress.EnrollmentProgressProjection;

public record CatalogCourseResponse(
                                    long id,
                                    String title,
                                    String summary,
                                    CourseStatus status,
                                    long teacherPassportUserId,
                                    String teacherName,
                                    String teacherDescription,
                                    Long coverImageAssetId,
                                    String coverImageUrl,
                                    List<CategoryResponse> categories,
                                    boolean teaching,
                                    EnrollmentStatus enrollmentStatus,
                                    String section,
                                    Integer completedItems,
                                    Integer totalItems,
                                    Double percentComplete,
                                    Boolean concluded,
                                    Instant concludedAt) {

    public static CatalogCourseResponse load(Course course, boolean teaching, EnrollmentStatus enrollmentStatus, String section) {
        return load(course, teaching, enrollmentStatus, section, null, null, null);
    }

    public static CatalogCourseResponse load(Course course,
                                             boolean teaching,
                                             EnrollmentStatus enrollmentStatus,
                                             String section,
                                             AuthorProfile author) {
        return load(course, teaching, enrollmentStatus, section, author, null, null);
    }

    public static CatalogCourseResponse load(Course course,
                                             boolean teaching,
                                             EnrollmentStatus enrollmentStatus,
                                             String section,
                                             AuthorProfile author,
                                             String coverImageUrl) {
        return load(course, teaching, enrollmentStatus, section, author, coverImageUrl, null);
    }

    public static CatalogCourseResponse load(Course course,
                                             boolean teaching,
                                             EnrollmentStatus enrollmentStatus,
                                             String section,
                                             AuthorProfile author,
                                             String coverImageUrl,
                                             EnrollmentProgressProjection progress) {
        var teacherName = author != null && author.name() != null && !author.name().isBlank()
                                                                                              ? author.name()
                                                                                              : course.getTeacherName();
        var description = author != null && author.description() != null ? author.description() : "";
        return new CatalogCourseResponse(course.getId(),
                                         course.getTitle(),
                                         course.getSummary(),
                                         course.getStatus(),
                                         course.getTeacherPassportUserId(),
                                         teacherName,
                                         description,
                                         course.getCoverImageAssetId(),
                                         coverImageUrl,
                                         course.getCategories().stream().map(CategoryResponse::load).toList(),
                                         teaching,
                                         enrollmentStatus,
                                         section,
                                         progress != null ? progress.completedItems() : null,
                                         progress != null ? progress.totalItems() : null,
                                         progress != null ? progress.percentComplete() : null,
                                         progress != null ? progress.concluded() : null,
                                         progress != null ? progress.concludedAt() : null);
    }
}
