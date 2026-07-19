package dev.vepo.cursos.course.image;

import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CourseImageAssetRepository {

    private final EntityManager entityManager;

    @Inject
    public CourseImageAssetRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<CourseImageAsset> findById(long id) {
        return Optional.ofNullable(entityManager.find(CourseImageAsset.class, id));
    }

    public Optional<CourseImageAsset> findByCourseAndId(long courseId, long assetId) {
        return entityManager.createQuery("""
                                         FROM CourseImageAsset a
                                         WHERE a.course.id = :courseId AND a.id = :assetId
                                         """, CourseImageAsset.class)
                            .setParameter("courseId", courseId)
                            .setParameter("assetId", assetId)
                            .getResultStream()
                            .findFirst();
    }

    public List<CourseImageAsset> listByCourse(long courseId) {
        return entityManager.createQuery("""
                                         FROM CourseImageAsset a
                                         WHERE a.course.id = :courseId
                                         ORDER BY a.createdAt DESC, a.id DESC
                                         """, CourseImageAsset.class)
                            .setParameter("courseId", courseId)
                            .getResultList();
    }

    public List<CourseImageAsset> findByCourseAndIds(long courseId, List<Long> assetIds) {
        if (assetIds == null || assetIds.isEmpty()) {
            return List.of();
        }
        return entityManager.createQuery("""
                                         FROM CourseImageAsset a
                                         WHERE a.course.id = :courseId AND a.id IN :assetIds
                                         """, CourseImageAsset.class)
                            .setParameter("courseId", courseId)
                            .setParameter("assetIds", assetIds)
                            .getResultList();
    }

    @Transactional
    public CourseImageAsset save(CourseImageAsset asset) {
        entityManager.persist(asset);
        return asset;
    }

    @Transactional
    public void delete(CourseImageAsset asset) {
        entityManager.remove(entityManager.contains(asset) ? asset : entityManager.merge(asset));
    }
}
