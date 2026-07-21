package dev.vepo.cursos.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AppendMarkdownBlockRequest(
                                         @NotBlank @Size(max = 1_000_000) String markdownBody) {}
