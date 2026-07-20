package dev.vepo.cursos.branding;

public record BrandingResponse(
                               String name,
                               String tagline,
                               String logoUrl,
                               String faviconUrl,
                               String accent,
                               String headerBg,
                               String onChrome,
                               String pageBg,
                               String surface,
                               String text,
                               String textMuted,
                               String link,
                               String border,
                               String danger,
                               String supportUrl,
                               String docsUrl,
                               String legalUrl,
                               String credit,
                               boolean showDeveloperLinks) {

    public static BrandingResponse load(BrandProperties properties) {
        return new BrandingResponse(
                                    properties.name(),
                                    properties.tagline(),
                                    properties.logoUrl().orElse(null),
                                    properties.faviconUrl().orElse(null),
                                    properties.accent(),
                                    properties.headerBg(),
                                    properties.onChrome(),
                                    properties.pageBg(),
                                    properties.surface(),
                                    properties.text(),
                                    properties.textMuted(),
                                    properties.link(),
                                    properties.border(),
                                    properties.danger(),
                                    properties.supportUrl().orElse(null),
                                    properties.docsUrl().orElse(null),
                                    properties.legalUrl().orElse(null),
                                    properties.credit().orElse(null),
                                    properties.showDeveloperLinks());
    }
}
