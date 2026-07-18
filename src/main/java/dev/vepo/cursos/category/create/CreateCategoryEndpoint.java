package dev.vepo.cursos.category.create;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.category.CategoryResponse;
import dev.vepo.cursos.category.CategoryService;
import dev.vepo.cursos.category.CreateCategoryRequest;
import jakarta.annotation.security.DenyAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/categories")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Categories")
public class CreateCategoryEndpoint {

    private final CategoryService categoryService;

    @Inject
    public CreateCategoryEndpoint(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @POST
    @RolesAllowed("cursos.admin")
    @Operation(operationId = "createCategory")
    public CategoryResponse create(@Valid CreateCategoryRequest request) {
        return CategoryResponse.load(categoryService.create(request));
    }
}
