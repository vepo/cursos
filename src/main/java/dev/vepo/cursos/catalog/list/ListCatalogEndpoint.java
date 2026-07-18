package dev.vepo.cursos.catalog.list;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.catalog.CatalogResponse;
import dev.vepo.cursos.catalog.CatalogService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/catalog/courses")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Catalog")
public class ListCatalogEndpoint {
    private final CatalogService catalogService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ListCatalogEndpoint(CatalogService catalogService, CurrentPassportUser currentPassportUser) {
        this.catalogService = catalogService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Operation(operationId = "listCatalog")
    public CatalogResponse list(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorization,
                                @QueryParam("category") String category) {
        return catalogService.loadCatalog(currentPassportUser.require(), category, authorization);
    }
}
