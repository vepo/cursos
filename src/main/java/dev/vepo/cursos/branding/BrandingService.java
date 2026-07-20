package dev.vepo.cursos.branding;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class BrandingService {

    private final BrandProperties brandProperties;

    @Inject
    public BrandingService(BrandProperties brandProperties) {
        this.brandProperties = brandProperties;
    }

    public BrandingResponse current() {
        return BrandingResponse.load(brandProperties);
    }
}
