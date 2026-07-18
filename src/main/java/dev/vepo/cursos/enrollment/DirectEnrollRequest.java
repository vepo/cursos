package dev.vepo.cursos.enrollment;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DirectEnrollRequest(
                                  @NotNull Long passportUserId,
                                  @NotBlank String username,
                                  @NotBlank String name,
                                  @NotBlank @Email String email) {}
