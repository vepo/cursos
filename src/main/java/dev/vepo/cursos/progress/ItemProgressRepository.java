package dev.vepo.cursos.progress;

import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class ItemProgressRepository {

    private final EntityManager entityManager;

    @Inject
    public ItemProgressRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<ItemProgress> findByEnrollmentAndItem(long enrollmentId, long courseItemId) {
        return entityManager.createQuery("""
                                         FROM ItemProgress p
                                         WHERE p.enrollment.id = :enrollmentId
                                           AND p.courseItem.id = :itemId
                                         """, ItemProgress.class)
                            .setParameter("enrollmentId", enrollmentId)
                            .setParameter("itemId", courseItemId)
                            .getResultStream()
                            .findFirst();
    }

    public List<ItemProgress> listByEnrollment(long enrollmentId) {
        return entityManager.createQuery("""
                                         FROM ItemProgress p
                                         WHERE p.enrollment.id = :enrollmentId
                                         """, ItemProgress.class)
                            .setParameter("enrollmentId", enrollmentId)
                            .getResultList();
    }

    public long countCompleted(long enrollmentId) {
        return entityManager.createQuery("""
                                         SELECT COUNT(p) FROM ItemProgress p
                                         WHERE p.enrollment.id = :enrollmentId AND p.completed = true
                                         """, Long.class)
                            .setParameter("enrollmentId", enrollmentId)
                            .getSingleResult();
    }

    @Transactional
    public int clearCompletedAfterSortOrder(long enrollmentId, int afterSortOrder, long actorPassportUserId) {
        var now = java.time.Instant.now();
        int updated = entityManager.createQuery("""
                                                UPDATE ItemProgress p
                                                SET p.completed = false,
                                                    p.actorPassportUserId = :actorId,
                                                    p.updatedAt = :updatedAt
                                                WHERE p.enrollment.id = :enrollmentId
                                                  AND p.completed = true
                                                  AND p.courseItem.sortOrder > :afterSortOrder
                                                """)
                                   .setParameter("enrollmentId", enrollmentId)
                                   .setParameter("afterSortOrder", afterSortOrder)
                                   .setParameter("actorId", actorPassportUserId)
                                   .setParameter("updatedAt", now)
                                   .executeUpdate();
        entityManager.flush();
        return updated;
    }

    @Transactional
    public ItemProgress save(ItemProgress progress) {
        entityManager.persist(progress);
        return progress;
    }
}
