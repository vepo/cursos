package dev.vepo.cursos.course;

import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CourseRepository {

    private final EntityManager entityManager;

    @Inject
    public CourseRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<Course> findById(long id) {
        return entityManager.createQuery("""
                                         SELECT c FROM Course c
                                         LEFT JOIN FETCH c.categories
                                         WHERE c.id = :id
                                         """, Course.class)
                            .setParameter("id", id)
                            .getResultStream()
                            .findFirst();
    }

    public List<Course> listPublished() {
        return entityManager.createQuery("""
                                         SELECT DISTINCT c FROM Course c
                                         LEFT JOIN FETCH c.categories
                                         WHERE c.status = :status
                                         ORDER BY c.title
                                         """, Course.class)
                            .setParameter("status", CourseStatus.PUBLISHED)
                            .getResultList();
    }

    public List<Course> listTaughtBy(long teacherPassportUserId) {
        return entityManager.createQuery("""
                                         SELECT DISTINCT c FROM Course c
                                         LEFT JOIN FETCH c.categories
                                         WHERE c.teacherPassportUserId = :teacherId
                                         ORDER BY c.title
                                         """, Course.class)
                            .setParameter("teacherId", teacherPassportUserId)
                            .getResultList();
    }

    @Transactional
    public Course save(Course course) {
        entityManager.persist(course);
        return course;
    }

    @Transactional
    public Course merge(Course course) {
        return entityManager.merge(course);
    }
}
