package dev.vepo.cursos.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;

import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import dev.vepo.cursos.infra.passport.PassportPublicAuthorResponse;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

@QuarkusTest
@DisplayName("Author profile service")
class AuthorProfileServiceTest {

    @InjectMock
    @RestClient
    PassportRestClient passportRestClient;

    @Inject
    AuthorProfileService authorProfileService;

    @BeforeEach
    void setUp() {
        Mockito.reset(passportRestClient);
    }

    @Test
    @DisplayName("shouldReturnEmptyMapWhenTeacherIdsEmptyOrAllNull")
    void shouldReturnEmptyMapWhenTeacherIdsEmptyOrAllNull() {
        assertTrue(authorProfileService.lookup("Bearer t", List.of()).isEmpty());
        assertTrue(authorProfileService.lookup("Bearer t", java.util.Arrays.asList(null, null)).isEmpty());
    }

    @Test
    @DisplayName("shouldMapPassportAuthorsAndDefaultNullDescription")
    void shouldMapPassportAuthorsAndDefaultNullDescription() {
        when(passportRestClient.lookupAuthors(eq("Bearer t"), any()))
                                                                     .thenReturn(List.of(new PassportPublicAuthorResponse(1L, "alice", "Alice", null),
                                                                                         new PassportPublicAuthorResponse(2L, "bob", "Bob", "Bio")));

        var authors = authorProfileService.lookup("Bearer t", List.of(1L, 2L, 1L));
        assertEquals(2, authors.size());
        assertEquals("", authors.get(1L).description());
        assertEquals("Bio", authors.get(2L).description());
        assertEquals("alice", authors.get(1L).username());
    }

    @Test
    @DisplayName("shouldReturnEmptyMapWhenPassportThrows")
    void shouldReturnEmptyMapWhenPassportThrows() {
        when(passportRestClient.lookupAuthors(eq("Bearer t"), any())).thenThrow(new RuntimeException("down"));
        assertTrue(authorProfileService.lookup("Bearer t", List.of(9L)).isEmpty());
    }

    @Test
    @DisplayName("shouldResolveFallbackWhenAuthorMissingFromPassport")
    void shouldResolveFallbackWhenAuthorMissingFromPassport() {
        when(passportRestClient.lookupAuthors(eq("Bearer t"), any())).thenReturn(List.of());
        var profile = authorProfileService.resolve("Bearer t", 7L, "ghost", "Ghost Teacher");
        assertEquals(7L, profile.id());
        assertEquals("ghost", profile.username());
        assertEquals("Ghost Teacher", profile.name());
        assertEquals("", profile.description());
    }
}
