package dev.vepo.cursos.study;

import java.time.Instant;
import java.util.List;

public record StudyResponse(
                            long courseId,
                            List<StudyItemResponse> items,
                            int completedItems,
                            int totalItems,
                            double percentComplete,
                            boolean concluded,
                            Instant concludedAt) {}
