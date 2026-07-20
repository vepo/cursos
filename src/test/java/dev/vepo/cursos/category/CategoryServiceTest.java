package dev.vepo.cursos.category;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.infra.CursosException;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

@QuarkusTest
@DisplayName("Category service")
class CategoryServiceTest {

    @Inject
    CategoryService categoryService;

    @BeforeEach
    void setUp() {
        Given.cleanup();
    }

    @Test
    @DisplayName("shouldSlugifyNamesAndRejectBlankSlug")
    void shouldSlugifyNamesAndRejectBlankSlug() {
        assertEquals("java-basics", CategoryService.slugify("  Java Basics  "));
        assertEquals("cafe", CategoryService.slugify("Café"));
        assertThrows(CursosException.class, () -> CategoryService.slugify("!!!"));
    }

    @Test
    @DisplayName("shouldCreateFromNameWhenSlugOmittedAndConflictOnDuplicate")
    void shouldCreateFromNameWhenSlugOmittedAndConflictOnDuplicate() {
        var created = categoryService.create(new CreateCategoryRequest("Quarkus Tips", null));
        assertEquals("quarkus-tips", created.getSlug());

        assertThrows(CursosException.class, () -> categoryService.create(new CreateCategoryRequest("Other", "quarkus-tips")));
        assertThrows(CursosException.class, () -> categoryService.require(999999L));
    }

    @Test
    @DisplayName("shouldFindOrCreateCategoryByName")
    void shouldFindOrCreateCategoryByName() {
        var first = categoryService.findOrCreateByName("Domain Driven Design");
        var second = categoryService.findOrCreateByName("domain driven design");
        assertEquals(first.getId(), second.getId());
        assertTrue(categoryService.list().stream().anyMatch(c -> c.getId().equals(first.getId())));
    }
}
