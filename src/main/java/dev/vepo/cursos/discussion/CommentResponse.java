package dev.vepo.cursos.discussion;

import java.time.Instant;

public record CommentResponse(long id,
                              long courseItemId,
                              long authorPassportUserId,
                              String authorUsername,
                              String authorName,
                              String content,
                              Instant createdAt,
                              boolean hidden,
                              int count,
                              boolean callerUpvoted) {

    public static CommentResponse load(Comment comment, int count, boolean callerUpvoted) {
        return new CommentResponse(comment.getId(),
                                   comment.getCourseItem().getId(),
                                   comment.getAuthorPassportUserId(),
                                   comment.getAuthorUsername(),
                                   comment.getAuthorName(),
                                   comment.getContent(),
                                   comment.getCreatedAt(),
                                   comment.getHiddenAt() != null,
                                   count,
                                   callerUpvoted);
    }
}
