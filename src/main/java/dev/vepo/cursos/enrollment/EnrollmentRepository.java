package dev.vepo.cursos.enrollment;

import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class EnrollmentRepository {

    private final EntityManager entityManager;

    @Inject
    public EnrollmentRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<Enrollment> findById(long id) {
        return Optional.ofNullable(entityManager.find(Enrollment.class, id));
    }

    public Optional<Enrollment> findByCourseAndStudent(long courseId, long studentPassportUserId) {
        return entityManager.createQuery("""
                                         FROM Enrollment e
                                         WHERE e.course.id = :courseId
                                           AND e.studentPassportUserId = :studentId
                                         """, Enrollment.class)
                            .setParameter("courseId", courseId)
                            .setParameter("studentId", studentPassportUserId)
                            .getResultStream()
                            .findFirst();
    }

    public List<Enrollment> listByCourse(long courseId) {
        return entityManager.createQuery("""
                                         FROM Enrollment e
                                         WHERE e.course.id = :courseId
                                         ORDER BY e.studentName
                                         """, Enrollment.class)
                            .setParameter("courseId", courseId)
                            .getResultList();
    }

    public List<Enrollment> listByStudent(long studentPassportUserId) {
        return entityManager.createQuery("""
                                         SELECT e FROM Enrollment e
                                         JOIN FETCH e.course c
                                         LEFT JOIN FETCH c.categories
                                         WHERE e.studentPassportUserId = :studentId
                                         ORDER BY c.title
                                         """, Enrollment.class)
                            .setParameter("studentId", studentPassportUserId)
                            .getResultList();
    }

    @Transactional
    public Enrollment save(Enrollment enrollment) {
        entityManager.persist(enrollment);
        return enrollment;
    }
}
