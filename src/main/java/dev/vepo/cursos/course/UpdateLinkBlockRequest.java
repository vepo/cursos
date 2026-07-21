package dev.vepo.cursos.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateLinkBlockRequest(
                                     @NotBlank @Size(max = 2000) String linkUrl,
                                     @Size(max = 2000) String linkDescription) {}
