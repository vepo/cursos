package dev.vepo.cursos.course;

import java.util.List;

import jakarta.validation.constraints.NotNull;

public record ReorderCourseItemsRequest(@NotNull List<Long> itemIds) {}
