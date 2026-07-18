package dev.vepo.cursos.course;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.Set;

import dev.vepo.cursos.infra.CursosException;
import io.quarkus.runtime.LaunchMode;

public final class LinkUrlValidator {

    private static final Set<String> FORBIDDEN_SCHEMES = Set.of("javascript", "data", "file", "vbscript");

    private LinkUrlValidator() {}

    public static String requireSafeAbsoluteUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw CursosException.badRequest("Link URL is required");
        }
        var trimmed = rawUrl.trim();
        final URI uri;
        try {
            uri = new URI(trimmed);
        } catch (URISyntaxException ex) {
            throw CursosException.badRequest("Link URL is not a valid absolute URL");
        }
        if (!uri.isAbsolute() || uri.getScheme() == null || uri.getHost() == null) {
            throw CursosException.badRequest("Link URL must be an absolute http(s) URL");
        }
        var scheme = uri.getScheme().toLowerCase(Locale.ROOT);
        if (FORBIDDEN_SCHEMES.contains(scheme)) {
            throw CursosException.badRequest("Link URL scheme is not allowed");
        }
        if ("https".equals(scheme)) {
            return uri.toString();
        }
        if ("http".equals(scheme) && isLocalhostAllowed(uri.getHost())) {
            return uri.toString();
        }
        throw CursosException.badRequest("Link URL must use https (or http://localhost in development)");
    }

    private static boolean isLocalhostAllowed(String host) {
        var normalized = host.toLowerCase(Locale.ROOT);
        if (!"localhost".equals(normalized) && !"127.0.0.1".equals(normalized) && !"[::1]".equals(normalized)) {
            return false;
        }
        return LaunchMode.current() == LaunchMode.DEVELOPMENT || LaunchMode.current() == LaunchMode.TEST;
    }
}
