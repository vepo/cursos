package dev.vepo.cursos.course;

import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CourseResourceRepository {

    private final EntityManager entityManager;

    @Inject
    public CourseResourceRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Optional<CourseResource> findById(long id) {
        return Optional.ofNullable(entityManager.find(CourseResource.class, id));
    }

    @Transactional
    public CourseResource save(CourseResource resource) {
        entityManager.persist(resource);
        return resource;
    }
}
