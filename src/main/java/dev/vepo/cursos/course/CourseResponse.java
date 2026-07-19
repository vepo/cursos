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
                             Long coverImageAssetId,
                             String coverImageUrl,
                             List<CategoryResponse> categories,
                             Instant createdAt,
                             Instant updatedAt) {

    public static CourseResponse load(Course course) {
        return load(course, null, null);
    }

    public static CourseResponse load(Course course, AuthorProfile author) {
        return load(course, author, null);
    }

    public static CourseResponse load(Course course, AuthorProfile author, String coverImageUrl) {
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
                                  course.getCoverImageAssetId(),
                                  coverImageUrl,
                                  course.getCategories().stream().map(CategoryResponse::load).toList(),
                                  course.getCreatedAt(),
                                  course.getUpdatedAt());
    }
}
