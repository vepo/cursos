package dev.vepo.cursos.course;

import java.time.Instant;
import java.util.List;

import dev.vepo.cursos.category.CategoryResponse;
import dev.vepo.cursos.identity.AuthorProfile;

public record CourseResponse(
                             long id,
                             String title,
                             String summary,
                             CourseStatus status,
                             long teacherPassportUserId,
                             String teacherUsername,
                             String teacherName,
                             String teacherDescription,
                             List<CategoryResponse> categories,
                             Instant createdAt,
                             Instant updatedAt) {

    public static CourseResponse load(Course course) {
        return load(course, null);
    }

    public static CourseResponse load(Course course, AuthorProfile author) {
        var teacherName = author != null && author.name() != null && !author.name().isBlank()
                                                                                              ? author.name()
                                                                                              : course.getTeacherName();
        var teacherUsername = author != null && author.username() != null && !author.username().isBlank()
                                                                                                          ? author.username()
                                                                                                          : course.getTeacherUsername();
        var description = author != null && author.description() != null ? author.description() : "";
        return new CourseResponse(course.getId(),
                                  course.getTitle(),
                                  course.getSummary(),
                                  course.getStatus(),
                                  course.getTeacherPassportUserId(),
                                  teacherUsername,
                                  teacherName,
                                  description,
                                  course.getCategories().stream().map(CategoryResponse::load).toList(),
                                  course.getCreatedAt(),
                                  course.getUpdatedAt());
    }
}
