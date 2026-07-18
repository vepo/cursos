package dev.vepo.cursos.git;

import java.time.Instant;

public record CourseGitStatusResponse(
                                      long courseId,
                                      String remoteUrl,
                                      String defaultBranch,
                                      String descriptionPath,
                                      String lastSyncedSha,
                                      Instant lastSyncedAt,
                                      String status,
                                      String errorSummary) {

    public static CourseGitStatusResponse load(CourseGitRepository repository) {
        return new CourseGitStatusResponse(repository.getCourse().getId(),
                                           repository.getRemoteUrl(),
                                           repository.getDefaultBranch(),
                                           repository.getDescriptionPath(),
                                           repository.getLastSyncedSha(),
                                           repository.getLastSyncedAt(),
                                           repository.getStatus(),
                                           repository.getErrorSummary());
    }
}
