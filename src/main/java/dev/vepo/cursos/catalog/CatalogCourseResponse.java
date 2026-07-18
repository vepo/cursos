package dev.vepo.cursos.catalog;

import java.util.List;

import dev.vepo.cursos.category.CategoryResponse;
import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.AuthorProfile;

public record CatalogCourseResponse(
                                    long id,
                                    String title,
                                    String summary,
                                    CourseStatus status,
                                    long teacherPassportUserId,
                                    String teacherName,
                                    String teacherDescription,
                                    List<CategoryResponse> categories,
                                    boolean teaching,
                                    EnrollmentStatus enrollmentStatus,
                                    String section) {

    public static CatalogCourseResponse load(Course course, boolean teaching, EnrollmentStatus enrollmentStatus, String section) {
        return load(course, teaching, enrollmentStatus, section, null);
    }

    public static CatalogCourseResponse load(Course course,
                                             boolean teaching,
                                             EnrollmentStatus enrollmentStatus,
                                             String section,
                                             AuthorProfile author) {
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
                                         course.getCategories().stream().map(CategoryResponse::load).toList(),
                                         teaching,
                                         enrollmentStatus,
                                         section);
    }
}
