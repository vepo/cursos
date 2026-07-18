package dev.vepo.cursos.git;

import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CourseGitLinkRepository {

    private final EntityManager entityManager;

    @Inject
    public CourseGitLinkRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<CourseGitRepository> findByCourseId(long courseId) {
        return entityManager.createQuery("""
                                         FROM CourseGitRepository g
                                         WHERE g.course.id = :courseId
                                         """, CourseGitRepository.class)
                            .setParameter("courseId", courseId)
                            .getResultStream()
                            .findFirst();
    }

    @Transactional
    public CourseGitRepository save(CourseGitRepository repository) {
        entityManager.persist(repository);
        return repository;
    }

    @Transactional
    public void delete(CourseGitRepository repository) {
        entityManager.remove(entityManager.contains(repository) ? repository : entityManager.merge(repository));
    }
}
