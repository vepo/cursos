package dev.vepo.cursos.auth;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.Set;

import org.apache.http.HttpStatus;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.passport.PassportCurrentUserResponse;
import dev.vepo.cursos.infra.passport.PassportLoginResponse;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

@QuarkusTest
@DisplayName("Auth proxy endpoints")
class AuthProxyEndpointTest {

    @InjectMock
    @RestClient
    PassportRestClient passportRestClient;

    private PassportUser user;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        user = Given.user(50L, "auth-user");
        Mockito.reset(passportRestClient);
    }

    @Test
    @DisplayName("shouldReturnPassportMeWhenPassportSucceeds")
    void shouldReturnPassportMeWhenPassportSucceeds() {
        var auth = Given.authenticated(user.id(), user.username(), user.name(), user.email(), Set.of("USER", "TEACHER"));
        when(passportRestClient.me(eq(auth.getValue())))
                                                        .thenReturn(new PassportCurrentUserResponse(user.id(),
                                                                                                    user.username(),
                                                                                                    "Passport Name",
                                                                                                    "passport@cursos.dev",
                                                                                                    "Teacher bio",
                                                                                                    Set.of("passport.admin")));

        given().header(auth)
               .when()
               .get("/api/auth/me")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("id", equalTo((int) user.id()))
               .body("username", equalTo(user.username()))
               .body("name", equalTo("Passport Name"))
               .body("email", equalTo("passport@cursos.dev"))
               .body("description", equalTo("Teacher bio"))
               .body("roles", hasItem("passport.admin"));
    }

    @Test
    @DisplayName("shouldFallbackToJwtClaimsWhenPassportFails")
    void shouldFallbackToJwtClaimsWhenPassportFails() {
        var auth = Given.authenticated(user.id(), user.username(), user.name(), user.email(), Set.of("USER"));
        when(passportRestClient.me(eq(auth.getValue()))).thenThrow(new RuntimeException("Passport down"));

        given().header(auth)
               .when()
               .get("/api/auth/me")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("id", equalTo((int) user.id()))
               .body("username", equalTo(user.username()))
               .body("name", equalTo(user.name()))
               .body("email", equalTo(user.email()))
               .body("description", equalTo(""))
               .body("roles", hasItem("USER"));
    }

    @Test
    @DisplayName("shouldMapNullDescriptionAndRolesFromPassportMe")
    void shouldMapNullDescriptionAndRolesFromPassportMe() {
        var auth = Given.authenticated(user.id(), user.username(), user.name(), user.email());
        when(passportRestClient.me(eq(auth.getValue())))
                                                        .thenReturn(new PassportCurrentUserResponse(user.id(),
                                                                                                    user.username(),
                                                                                                    user.name(),
                                                                                                    user.email(),
                                                                                                    null,
                                                                                                    null));

        given().header(auth)
               .when()
               .get("/api/auth/me")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("description", equalTo(""))
               .body("roles", hasSize(0));
    }

    @Test
    @DisplayName("shouldReturnTokenWhenPassportLoginSucceeds")
    void shouldReturnTokenWhenPassportLoginSucceeds() {
        when(passportRestClient.login(any()))
                                             .thenReturn(new PassportLoginResponse("jwt-token",
                                                                                   new PassportLoginResponse.PassportUserInfo(user.id(),
                                                                                                                              user.username(),
                                                                                                                              user.name(),
                                                                                                                              user.email(),
                                                                                                                              Set.of("USER"))));

        given().contentType(ContentType.JSON)
               .body("""
                     {"email":"%s","password":"secret"}
                     """.formatted(user.email()))
               .when()
               .post("/api/auth/login")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("token", equalTo("jwt-token"))
               .body("user.id", equalTo((int) user.id()))
               .body("user.username", equalTo(user.username()))
               .body("user.profiles", hasItem("USER"));
    }

    @Test
    @DisplayName("shouldMapInvalidCredentialsFromPassport")
    void shouldMapInvalidCredentialsFromPassport() {
        when(passportRestClient.login(any()))
                                             .thenThrow(new WebApplicationException(Response.status(HttpStatus.SC_UNAUTHORIZED).build()));

        given().contentType(ContentType.JSON)
               .body("""
                     {"email":"%s","password":"wrong"}
                     """.formatted(user.email()))
               .when()
               .post("/api/auth/login")
               .then()
               .statusCode(HttpStatus.SC_UNAUTHORIZED);
    }
}
