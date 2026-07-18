package dev.vepo.cursos.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMarkdownItemRequest(
                                        @NotBlank @Size(max = 200) String title,
                                        String markdownBody) {}
