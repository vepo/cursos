package dev.vepo.cursos.catalog;

import java.util.List;

import dev.vepo.cursos.category.CategoryResponse;
import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.enrollment.EnrollmentStatus;

public record CatalogCourseResponse(
                                    long id,
                                    String title,
                                    String summary,
                                    CourseStatus status,
                                    String teacherName,
                                    List<CategoryResponse> categories,
                                    boolean teaching,
                                    EnrollmentStatus enrollmentStatus,
                                    String section) {

    public static CatalogCourseResponse load(Course course, boolean teaching, EnrollmentStatus enrollmentStatus, String section) {
        return new CatalogCourseResponse(course.getId(),
                                         course.getTitle(),
                                         course.getSummary(),
                                         course.getStatus(),
                                         course.getTeacherName(),
                                         course.getCategories().stream().map(CategoryResponse::load).toList(),
                                         teaching,
                                         enrollmentStatus,
                                         section);
    }
}
