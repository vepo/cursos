package dev.vepo.cursos.git;

import jakarta.validation.constraints.NotBlank;

public record LinkCourseGitRequest(
                                   @NotBlank String remoteUrl,
                                   String defaultBranch,
                                   String descriptionPath) {}
