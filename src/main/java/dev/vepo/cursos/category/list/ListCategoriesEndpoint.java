package dev.vepo.cursos.category.list;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.category.CategoryResponse;
import dev.vepo.cursos.category.CategoryService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/categories")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Categories")
public class ListCategoriesEndpoint {

    private final CategoryService categoryService;

    @Inject
    public ListCategoriesEndpoint(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GET
    @Authenticated
    @Operation(operationId = "listCategories")
    public List<CategoryResponse> list() {
        return categoryService.list().stream().map(CategoryResponse::load).toList();
    }
}
