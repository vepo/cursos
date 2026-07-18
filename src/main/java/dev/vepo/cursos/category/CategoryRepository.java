package dev.vepo.cursos.category;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CategoryRepository {

    private final EntityManager entityManager;

    @Inject
    public CategoryRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public List<Category> listAll() {
        return entityManager.createQuery("FROM Category c ORDER BY c.name", Category.class).getResultList();
    }

    public Optional<Category> findById(long id) {
        return Optional.ofNullable(entityManager.find(Category.class, id));
    }

    public Optional<Category> findBySlug(String slug) {
        return entityManager.createQuery("FROM Category c WHERE c.slug = :slug", Category.class)
                            .setParameter("slug", slug)
                            .getResultStream()
                            .findFirst();
    }

    public Optional<Category> findByNameIgnoreCase(String name) {
        return entityManager.createQuery("FROM Category c WHERE LOWER(c.name) = :name", Category.class)
                            .setParameter("name", name.toLowerCase())
                            .getResultStream()
                            .findFirst();
    }

    public List<Category> findByIds(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return entityManager.createQuery("FROM Category c WHERE c.id IN :ids", Category.class)
                            .setParameter("ids", ids)
                            .getResultList();
    }

    @Transactional
    public Category save(Category category) {
        entityManager.persist(category);
        return category;
    }
}
