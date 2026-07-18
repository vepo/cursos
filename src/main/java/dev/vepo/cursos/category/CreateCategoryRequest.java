package dev.vepo.cursos.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
                                    @NotBlank @Size(max = 100) String name,
                                    @Size(max = 100) String slug) {}
