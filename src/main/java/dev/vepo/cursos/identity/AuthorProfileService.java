package dev.vepo.cursos.identity;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import dev.vepo.cursos.infra.passport.PassportLookupAuthorsRequest;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class AuthorProfileService {
    private static final Logger logger = LoggerFactory.getLogger(AuthorProfileService.class);

    private final PassportRestClient passportRestClient;

    @Inject
    public AuthorProfileService(@RestClient PassportRestClient passportRestClient) {
        this.passportRestClient = passportRestClient;
    }

    public Map<Long, AuthorProfile> lookup(String authorization, Collection<Long> teacherIds) {
        var ids = teacherIds.stream().filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        try {
            var authors = passportRestClient.lookupAuthors(authorization, new PassportLookupAuthorsRequest(ids));
            return authors.stream()
                          .collect(Collectors.toMap(a -> a.id(),
                                                    a -> new AuthorProfile(a.id(), a.username(), a.name(),
                                                                           a.description() != null ? a.description() : ""),
                                                    (left, right) -> left,
                                                    HashMap::new));
        } catch (RuntimeException ex) {
            logger.warn("Failed to load author profiles from Passport: {}", ex.toString());
            return Map.of();
        }
    }

    public AuthorProfile resolve(String authorization, long teacherId, String username, String name) {
        return lookup(authorization, List.of(teacherId)).getOrDefault(teacherId, AuthorProfile.fallback(teacherId, username, name));
    }
}
