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

    public Optional<CourseResource> findByCourseAndResourceId(long courseId, long resourceId) {
        var results = entityManager.createQuery("""
                                                SELECT i.resource
                                                FROM CourseItem i
                                                WHERE i.course.id = :courseId
                                                  AND i.resource.id = :resourceId
                                                """, CourseResource.class)
                                   .setParameter("courseId", courseId)
                                   .setParameter("resourceId", resourceId)
                                   .setMaxResults(1)
                                   .getResultList();
        return results.stream().findFirst();
    }

    public Optional<ResourceSlice> readSlice(long resourceId, long startInclusive, long endInclusive) {
        var meta = entityManager.createQuery("""
                                             SELECT r.sizeBytes, r.contentType, r.filename
                                             FROM CourseResource r
                                             WHERE r.id = :id
                                             """, Object[].class)
                                .setParameter("id", resourceId)
                                .getResultStream()
                                .findFirst();
        if (meta.isEmpty()) {
            return Optional.empty();
        }
        var sizeBytes = ((Number) meta.get()[0]).longValue();
        var contentType = (String) meta.get()[1];
        var filename = (String) meta.get()[2];
        if (startInclusive < 0 || startInclusive >= sizeBytes || endInclusive < startInclusive) {
            return Optional.of(new ResourceSlice(contentType, filename, sizeBytes, startInclusive, endInclusive, new byte[0], true));
        }
        var clampedEnd = Math.min(endInclusive, sizeBytes - 1);
        var length = clampedEnd - startInclusive + 1;
        // PostgreSQL substring on bytea is 1-based
        var slice = (byte[]) entityManager.createNativeQuery("""
                                                             SELECT substr(content, CAST(:start AS integer), CAST(:length AS integer))
                                                             FROM tb_course_resources
                                                             WHERE id = :id
                                                             """)
                                          .setParameter("start", (int) (startInclusive + 1))
                                          .setParameter("length", (int) length)
                                          .setParameter("id", resourceId)
                                          .getSingleResult();
        return Optional.of(new ResourceSlice(contentType, filename, sizeBytes, startInclusive, clampedEnd, slice, false));
    }

    @Transactional
    public CourseResource save(CourseResource resource) {
        entityManager.persist(resource);
        return resource;
    }

    public record ResourceSlice(
                                String contentType,
                                String filename,
                                long sizeBytes,
                                long startInclusive,
                                long endInclusive,
                                byte[] content,
                                boolean unsatisfiable) {}
}
