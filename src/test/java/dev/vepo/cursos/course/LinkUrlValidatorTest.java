package dev.vepo.cursos.course;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import dev.vepo.cursos.infra.CursosException;
import io.quarkus.test.junit.QuarkusTest;

@QuarkusTest
@DisplayName("Link URL validator")
class LinkUrlValidatorTest {

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = { " ", "\t" })
    @DisplayName("shouldRejectNullBlankAndWhitespaceOnlyUrls")
    void shouldRejectNullBlankAndWhitespaceOnlyUrls(String rawUrl) {
        var ex = assertThrows(CursosException.class, () -> LinkUrlValidator.requireSafeAbsoluteUrl(rawUrl));
        assertEquals(400, ex.getResponse().getStatus());
        assertTrue(ex.getMessage().contains("required"));
    }

    @Test
    @DisplayName("shouldRejectRelativeAndHostlessUrls")
    void shouldRejectRelativeAndHostlessUrls() {
        assertThrows(CursosException.class, () -> LinkUrlValidator.requireSafeAbsoluteUrl("/relative/path"));
        assertThrows(CursosException.class, () -> LinkUrlValidator.requireSafeAbsoluteUrl("https:///no-host"));
        assertThrows(CursosException.class, () -> LinkUrlValidator.requireSafeAbsoluteUrl("not a url :::"));
    }

    @ParameterizedTest
    @ValueSource(strings = { "javascript:alert(1)", "data:text/html,hi", "file:///etc/passwd", "vbscript:msgbox(1)" })
    @DisplayName("shouldRejectForbiddenSchemes")
    void shouldRejectForbiddenSchemes(String rawUrl) {
        var ex = assertThrows(CursosException.class, () -> LinkUrlValidator.requireSafeAbsoluteUrl(rawUrl));
        assertTrue(ex.getMessage().contains("not allowed") || ex.getMessage().contains("absolute"));
    }

    @Test
    @DisplayName("shouldAcceptHttpsAbsoluteUrlAndTrim")
    void shouldAcceptHttpsAbsoluteUrlAndTrim() {
        assertEquals("https://example.com/guide", LinkUrlValidator.requireSafeAbsoluteUrl("  https://example.com/guide  "));
    }

    @Test
    @DisplayName("shouldAcceptHttpLocalhostInTestMode")
    void shouldAcceptHttpLocalhostInTestMode() {
        assertEquals("http://localhost:3000/docs", LinkUrlValidator.requireSafeAbsoluteUrl("http://localhost:3000/docs"));
        assertEquals("http://127.0.0.1/docs", LinkUrlValidator.requireSafeAbsoluteUrl("http://127.0.0.1/docs"));
    }

    @Test
    @DisplayName("shouldRejectHttpNonLocalhost")
    void shouldRejectHttpNonLocalhost() {
        var ex = assertThrows(CursosException.class, () -> LinkUrlValidator.requireSafeAbsoluteUrl("http://example.com/docs"));
        assertEquals(400, ex.getResponse().getStatus());
        assertTrue(ex.getMessage().contains("https"));
    }
}
