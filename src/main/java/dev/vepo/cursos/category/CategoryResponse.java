package dev.vepo.cursos.category;

public record CategoryResponse(long id, String name, String slug) {
    public static CategoryResponse load(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getSlug());
    }
}
