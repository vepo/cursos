package dev.vepo.cursos.progress;

import java.time.Instant;

public record ItemProgressResponse(long courseItemId, boolean completed, long actorPassportUserId, Instant updatedAt) {
    public static ItemProgressResponse load(ItemProgress progress) {
        return new ItemProgressResponse(progress.getCourseItem().getId(),
                                        progress.isCompleted(),
                                        progress.getActorPassportUserId(),
                                        progress.getUpdatedAt());
    }
}
