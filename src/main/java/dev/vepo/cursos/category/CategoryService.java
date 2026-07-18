package dev.vepo.cursos.category;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

import dev.vepo.cursos.infra.CursosException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Inject
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> list() {
        return categoryRepository.listAll();
    }

    @Transactional
    public Category create(CreateCategoryRequest request) {
        var slug = request.slug() != null && !request.slug().isBlank() ? slugify(request.slug()) : slugify(request.name());
        categoryRepository.findBySlug(slug).ifPresent(c -> {
            throw CursosException.conflict("Category slug already exists: %s".formatted(slug));
        });
        return categoryRepository.save(new Category(request.name().trim(), slug));
    }

    public Category require(long id) {
        return categoryRepository.findById(id).orElseThrow(() -> CursosException.notFound("Category not found: %d".formatted(id)));
    }

    @Transactional
    public Category findOrCreateByName(String name) {
        return categoryRepository.findByNameIgnoreCase(name.trim())
                                 .orElseGet(() -> categoryRepository.save(new Category(name.trim(), slugify(name))));
    }

    static String slugify(String value) {
        var normalized = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
                                   .replaceAll("\\p{M}", "")
                                   .toLowerCase(Locale.ROOT)
                                   .replaceAll("[^a-z0-9]+", "-")
                                   .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) {
            throw CursosException.badRequest("Invalid category slug");
        }
        return normalized;
    }
}
