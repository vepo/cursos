package dev.vepo.cursos.discussion;

import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CommentRepository {

    private final EntityManager entityManager;

    @Inject
    public CommentRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional
    public Optional<Comment> findById(long id) {
        return entityManager.createQuery("""
                                         SELECT c FROM Comment c
                                         JOIN FETCH c.courseItem
                                         WHERE c.id = :id
                                         """, Comment.class)
                            .setParameter("id", id)
                            .getResultStream()
                            .findFirst();
    }

    public List<Comment> listByCourseItem(long courseItemId) {
        return listByCourseItem(courseItemId, true);
    }

    public List<Comment> listVisibleByCourseItem(long courseItemId) {
        return listByCourseItem(courseItemId, false);
    }

    private List<Comment> listByCourseItem(long courseItemId, boolean includeHidden) {
        return entityManager.createQuery("""
                                         FROM Comment c
                                         WHERE c.courseItem.id = :courseItemId
                                           AND (:includeHidden = true OR c.hiddenAt IS NULL)
                                         ORDER BY c.createdAt, c.id
                                         """, Comment.class)
                            .setParameter("courseItemId", courseItemId)
                            .setParameter("includeHidden", includeHidden)
                            .getResultList();
    }

    @Transactional
    public Comment save(Comment comment) {
        if (comment.getId() == null) {
            entityManager.persist(comment);
            return comment;
        }
        return entityManager.merge(comment);
    }
}
