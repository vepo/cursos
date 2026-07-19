package dev.vepo.cursos.progress;

import java.time.Instant;

/**
 * Aggregated progress for one enrollment, used by study and catalog
 * projections.
 */
public record EnrollmentProgressProjection(
                                           int completedItems,
                                           int totalItems,
                                           double percentComplete,
                                           boolean concluded,
                                           Instant concludedAt) {}
