package dev.vepo.cursos.branding.get;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.branding.BrandingResponse;
import dev.vepo.cursos.branding.BrandingService;
import jakarta.annotation.security.DenyAll;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("/branding")
@ApplicationScoped
@DenyAll
@Tag(name = "Branding")
public class GetBrandingEndpoint {

    private final BrandingService brandingService;

    @Inject
    public GetBrandingEndpoint(BrandingService brandingService) {
        this.brandingService = brandingService;
    }

    @GET
    @PermitAll
    @Operation(operationId = "getBranding")
    public BrandingResponse get() {
        return brandingService.current();
    }
}
