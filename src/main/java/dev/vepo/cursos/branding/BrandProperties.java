package dev.vepo.cursos.branding;

import java.util.Optional;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class BrandProperties {

    private final String name;
    private final String tagline;
    private final Optional<String> logoUrl;
    private final Optional<String> faviconUrl;
    private final String accent;
    private final String headerBg;
    private final String onChrome;
    private final String pageBg;
    private final String surface;
    private final String text;
    private final String textMuted;
    private final String link;
    private final String border;
    private final String danger;
    private final Optional<String> supportUrl;
    private final Optional<String> docsUrl;
    private final Optional<String> legalUrl;
    private final Optional<String> credit;
    private final boolean showDeveloperLinks;

    @Inject
    public BrandProperties(
                           @ConfigProperty(name = "learn.brand.name", defaultValue = "Learn") String name,
                           @ConfigProperty(name = "learn.brand.tagline", defaultValue = "Aprenda no seu ritmo") String tagline,
                           @ConfigProperty(name = "learn.brand.logo-url") Optional<String> logoUrl,
                           @ConfigProperty(name = "learn.brand.favicon-url") Optional<String> faviconUrl,
                           @ConfigProperty(name = "learn.brand.accent", defaultValue = "#0D9488") String accent,
                           @ConfigProperty(name = "learn.brand.header-bg", defaultValue = "#0F172A") String headerBg,
                           @ConfigProperty(name = "learn.brand.on-chrome", defaultValue = "#F8FAFC") String onChrome,
                           @ConfigProperty(name = "learn.brand.page-bg", defaultValue = "#F8FAFC") String pageBg,
                           @ConfigProperty(name = "learn.brand.surface", defaultValue = "#FFFFFF") String surface,
                           @ConfigProperty(name = "learn.brand.text", defaultValue = "#0F172A") String text,
                           @ConfigProperty(name = "learn.brand.text-muted", defaultValue = "#64748B") String textMuted,
                           @ConfigProperty(name = "learn.brand.link", defaultValue = "#0F766E") String link,
                           @ConfigProperty(name = "learn.brand.border", defaultValue = "#E2E8F0") String border,
                           @ConfigProperty(name = "learn.brand.danger", defaultValue = "#DC2626") String danger,
                           @ConfigProperty(name = "learn.brand.support-url") Optional<String> supportUrl,
                           @ConfigProperty(name = "learn.brand.docs-url") Optional<String> docsUrl,
                           @ConfigProperty(name = "learn.brand.legal-url") Optional<String> legalUrl,
                           @ConfigProperty(name = "learn.brand.credit") Optional<String> credit,
                           @ConfigProperty(name = "learn.brand.show-developer-links", defaultValue = "false") boolean showDeveloperLinks) {
        this.name = name;
        this.tagline = tagline;
        this.logoUrl = blankToEmpty(logoUrl);
        this.faviconUrl = blankToEmpty(faviconUrl);
        this.accent = accent;
        this.headerBg = headerBg;
        this.onChrome = onChrome;
        this.pageBg = pageBg;
        this.surface = surface;
        this.text = text;
        this.textMuted = textMuted;
        this.link = link;
        this.border = border;
        this.danger = danger;
        this.supportUrl = blankToEmpty(supportUrl);
        this.docsUrl = blankToEmpty(docsUrl);
        this.legalUrl = blankToEmpty(legalUrl);
        this.credit = blankToEmpty(credit);
        this.showDeveloperLinks = showDeveloperLinks;
    }

    public String name() {
        return name;
    }

    public String tagline() {
        return tagline;
    }

    public Optional<String> logoUrl() {
        return logoUrl;
    }

    public Optional<String> faviconUrl() {
        return faviconUrl;
    }

    public String accent() {
        return accent;
    }

    public String headerBg() {
        return headerBg;
    }

    public String onChrome() {
        return onChrome;
    }

    public String pageBg() {
        return pageBg;
    }

    public String surface() {
        return surface;
    }

    public String text() {
        return text;
    }

    public String textMuted() {
        return textMuted;
    }

    public String link() {
        return link;
    }

    public String border() {
        return border;
    }

    public String danger() {
        return danger;
    }

    public Optional<String> supportUrl() {
        return supportUrl;
    }

    public Optional<String> docsUrl() {
        return docsUrl;
    }

    public Optional<String> legalUrl() {
        return legalUrl;
    }

    public Optional<String> credit() {
        return credit;
    }

    public boolean showDeveloperLinks() {
        return showDeveloperLinks;
    }

    private static Optional<String> blankToEmpty(Optional<String> value) {
        return value.filter(v -> !v.isBlank());
    }
}
