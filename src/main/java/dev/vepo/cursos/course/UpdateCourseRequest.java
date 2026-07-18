package dev.vepo.cursos.course;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCourseRequest(
                                  @NotBlank @Size(max = 200) String title,
                                  @Size(max = 2000) String summary,
                                  List<Long> categoryIds) {}
