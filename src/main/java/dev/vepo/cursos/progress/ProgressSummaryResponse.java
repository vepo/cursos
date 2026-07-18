package dev.vepo.cursos.progress;

import java.util.List;

public record ProgressSummaryResponse(
                                      long enrollmentId,
                                      long courseId,
                                      long studentPassportUserId,
                                      String studentName,
                                      int totalItems,
                                      int completedItems,
                                      double percentComplete,
                                      List<ItemProgressResponse> items) {}
