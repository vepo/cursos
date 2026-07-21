package dev.vepo.cursos.course;

import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AulaBlockRepository {

    private final EntityManager entityManager;

    @Inject
    public AulaBlockRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<AulaBlock> findById(long id) {
        return Optional.ofNullable(entityManager.find(AulaBlock.class, id));
    }

    public List<AulaBlock> listByItem(long courseItemId) {
        return entityManager.createQuery("""
                                         SELECT b FROM AulaBlock b
                                         LEFT JOIN FETCH b.resource
                                         WHERE b.courseItem.id = :itemId
                                         ORDER BY b.sortOrder
                                         """, AulaBlock.class)
                            .setParameter("itemId", courseItemId)
                            .getResultList();
    }

    public long countByItem(long courseItemId) {
        return entityManager.createQuery("""
                                         SELECT COUNT(b) FROM AulaBlock b
                                         WHERE b.courseItem.id = :itemId
                                         """, Long.class)
                            .setParameter("itemId", courseItemId)
                            .getSingleResult();
    }

    @Transactional
    public AulaBlock save(AulaBlock block) {
        entityManager.persist(block);
        return block;
    }

    @Transactional
    public void delete(AulaBlock block) {
        entityManager.remove(block);
    }

    public void flush() {
        entityManager.flush();
    }
}
