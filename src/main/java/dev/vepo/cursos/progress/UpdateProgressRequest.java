package dev.vepo.cursos.progress;

import jakarta.validation.constraints.NotNull;

public record UpdateProgressRequest(@NotNull Boolean completed, Long studentPassportUserId) {}
