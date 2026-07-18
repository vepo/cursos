package dev.vepo.cursos.discussion;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CommentUpvoteRepository {

    private final EntityManager entityManager;

    @Inject
    public CommentUpvoteRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<CommentUpvote> findByCommentAndVoter(long commentId, long voterPassportUserId) {
        return entityManager.createQuery("""
                                         FROM CommentUpvote u
                                         WHERE u.comment.id = :commentId
                                           AND u.voterPassportUserId = :voterPassportUserId
                                         """, CommentUpvote.class)
                            .setParameter("commentId", commentId)
                            .setParameter("voterPassportUserId", voterPassportUserId)
                            .getResultStream()
                            .findFirst();
    }

    public int countByComment(long commentId) {
        return entityManager.createQuery("""
                                         SELECT COUNT(u)
                                         FROM CommentUpvote u
                                         WHERE u.comment.id = :commentId
                                         """, Long.class)
                            .setParameter("commentId", commentId)
                            .getSingleResult()
                            .intValue();
    }

    public Map<Long, CommentUpvoteSummary> summarizeByComments(List<Long> commentIds, long viewerPassportUserId) {
        if (commentIds.isEmpty()) {
            return Map.of();
        }
        return entityManager.createQuery("""
                                         SELECT u.comment.id,
                                                COUNT(u),
                                                SUM(CASE WHEN u.voterPassportUserId = :viewerPassportUserId THEN 1 ELSE 0 END)
                                         FROM CommentUpvote u
                                         WHERE u.comment.id IN :commentIds
                                         GROUP BY u.comment.id
                                         """, Object[].class)
                            .setParameter("commentIds", commentIds)
                            .setParameter("viewerPassportUserId", viewerPassportUserId)
                            .getResultStream()
                            .map(row -> new CommentUpvoteSummary((Long) row[0],
                                                                 ((Long) row[1]).intValue(),
                                                                 ((Long) row[2]) > 0))
                            .collect(Collectors.toMap(CommentUpvoteSummary::commentId, summary -> summary));
    }

    @Transactional
    public CommentUpvote save(CommentUpvote upvote) {
        entityManager.persist(upvote);
        return upvote;
    }

    @Transactional
    public void delete(CommentUpvote upvote) {
        entityManager.remove(entityManager.contains(upvote) ? upvote : entityManager.merge(upvote));
    }

    public record CommentUpvoteSummary(long commentId, int count, boolean callerUpvoted) {}
}
