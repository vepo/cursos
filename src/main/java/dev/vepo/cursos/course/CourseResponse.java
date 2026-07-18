package dev.vepo.cursos.course;

import java.time.Instant;
import java.util.List;

import dev.vepo.cursos.category.CategoryResponse;

public record CourseResponse(
                             long id,
                             String title,
                             String summary,
                             CourseStatus status,
                             long teacherPassportUserId,
                             String teacherUsername,
                             String teacherName,
                             List<CategoryResponse> categories,
                             Instant createdAt,
                             Instant updatedAt) {

    public static CourseResponse load(Course course) {
        return new CourseResponse(course.getId(),
                                  course.getTitle(),
                                  course.getSummary(),
                                  course.getStatus(),
                                  course.getTeacherPassportUserId(),
                                  course.getTeacherUsername(),
                                  course.getTeacherName(),
                                  course.getCategories().stream().map(CategoryResponse::load).toList(),
                                  course.getCreatedAt(),
                                  course.getUpdatedAt());
    }
}
