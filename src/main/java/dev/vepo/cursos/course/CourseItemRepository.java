package dev.vepo.cursos.course;

import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CourseItemRepository {

    private final EntityManager entityManager;

    @Inject
    public CourseItemRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<CourseItem> findById(long id) {
        return Optional.ofNullable(entityManager.find(CourseItem.class, id));
    }

    public List<CourseItem> listByCourse(long courseId) {
        return entityManager.createQuery("""
                                         FROM CourseItem i
                                         WHERE i.course.id = :courseId
                                         ORDER BY i.sortOrder
                                         """, CourseItem.class)
                            .setParameter("courseId", courseId)
                            .getResultList();
    }

    public Optional<CourseItem> findByCourseAndSourcePath(long courseId, String sourcePath) {
        return entityManager.createQuery("""
                                         FROM CourseItem i
                                         WHERE i.course.id = :courseId AND i.sourcePath = :sourcePath
                                         """, CourseItem.class)
                            .setParameter("courseId", courseId)
                            .setParameter("sourcePath", sourcePath)
                            .getResultStream()
                            .findFirst();
    }

    public int countByCourse(long courseId) {
        return entityManager.createQuery("SELECT COUNT(i) FROM CourseItem i WHERE i.course.id = :courseId", Long.class)
                            .setParameter("courseId", courseId)
                            .getSingleResult()
                            .intValue();
    }

    @Transactional
    public CourseItem save(CourseItem item) {
        entityManager.persist(item);
        return item;
    }

    @Transactional
    public void delete(CourseItem item) {
        entityManager.remove(entityManager.contains(item) ? item : entityManager.merge(item));
    }

    @Transactional
    public void deleteAllForCourseExceptPaths(long courseId, List<String> keepPaths) {
        if (keepPaths == null || keepPaths.isEmpty()) {
            entityManager.createQuery("DELETE FROM CourseItem i WHERE i.course.id = :courseId")
                         .setParameter("courseId", courseId)
                         .executeUpdate();
            return;
        }
        entityManager.createQuery("""
                                  DELETE FROM CourseItem i
                                  WHERE i.course.id = :courseId
                                    AND (i.sourcePath IS NULL OR i.sourcePath NOT IN :keepPaths)
                                  """)
                     .setParameter("courseId", courseId)
                     .setParameter("keepPaths", keepPaths)
                     .executeUpdate();
    }
}
