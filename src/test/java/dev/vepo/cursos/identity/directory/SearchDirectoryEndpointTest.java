package dev.vepo.cursos.identity.directory;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;

import org.apache.http.HttpStatus;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.passport.PassportDirectoryPageResponse;
import dev.vepo.cursos.infra.passport.PassportDirectoryUserResponse;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

@QuarkusTest
@DisplayName("Directory search endpoint")
class SearchDirectoryEndpointTest {

    @InjectMock
    @RestClient
    PassportRestClient passportRestClient;

    private PassportUser user;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        user = Given.user(60L, "dir-user");
        Mockito.reset(passportRestClient);
    }

    @Test
    @DisplayName("shouldProxyDirectorySearchToPassport")
    void shouldProxyDirectorySearchToPassport() {
        var auth = Given.authenticated(user.id(), user.username(), user.name(), user.email());
        when(passportRestClient.searchDirectory(eq(auth.getValue()), eq("ali"), eq(0), eq(20)))
                                                                                               .thenReturn(new PassportDirectoryPageResponse(List.of(new PassportDirectoryUserResponse(1L,
                                                                                                                                                                                       "alice",
                                                                                                                                                                                       "Alice",
                                                                                                                                                                                       "alice@cursos.dev")),
                                                                                                                                             0,
                                                                                                                                             20,
                                                                                                                                             1L));

        given().header(auth)
               .queryParam("q", "ali")
               .when()
               .get("/api/directory/users")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("items", hasSize(1))
               .body("items[0].username", equalTo("alice"))
               .body("total", equalTo(1));
    }

    @Test
    @DisplayName("shouldMapPassportWebApplicationExceptionToCursosException")
    void shouldMapPassportWebApplicationExceptionToCursosException() {
        var auth = Given.authenticated(user.id(), user.username(), user.name(), user.email());
        when(passportRestClient.searchDirectory(eq(auth.getValue()), eq("x"), eq(0), eq(20)))
                                                                                             .thenThrow(new WebApplicationException(Response.status(HttpStatus.SC_BAD_GATEWAY)
                                                                                                                                            .build()));

        given().header(auth)
               .queryParam("q", "x")
               .when()
               .get("/api/directory/users")
               .then()
               .statusCode(HttpStatus.SC_BAD_GATEWAY);
    }
}
