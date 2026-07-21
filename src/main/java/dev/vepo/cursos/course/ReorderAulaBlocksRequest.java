package dev.vepo.cursos.course;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public record ReorderAulaBlocksRequest(@NotEmpty List<Long> blockIds) {}
