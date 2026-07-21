package dev.vepo.cursos.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCourseItemTitleRequest(@NotBlank @Size(max = 200) String title) {}
