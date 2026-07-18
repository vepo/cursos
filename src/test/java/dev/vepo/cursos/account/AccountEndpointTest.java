package dev.vepo.cursos.account;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
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
import dev.vepo.cursos.infra.passport.PassportRestClient;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.ws.rs.core.Response;

@QuarkusTest
@DisplayName("Account proxy endpoints")
class AccountEndpointTest {

    @InjectMock
    @RestClient
    PassportRestClient passportRestClient;

    private PassportUser user;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        user = Given.user(30L, "account");
        Mockito.reset(passportRestClient);
    }

    @Test
    @DisplayName("shouldUpdateAccountViaPassport")
    void shouldUpdateAccountViaPassport() {
        var auth = Given.authenticated(user.id(), user.username(), user.name(), user.email());
        when(passportRestClient.updateMe(eq(auth.getValue()), any()))
                                                                     .thenReturn(new PassportCurrentUserResponse(user.id(), user.username(), "New Name",
                                                                                                                 "new@cursos.dev", "Bio about teaching",
                                                                                                                 Set.of()));

        given().header(auth)
               .contentType(ContentType.JSON)
               .body("""
                     {"name":"New Name","email":"new@cursos.dev","description":"Bio about teaching"}
                     """)
               .when()
               .put("/api/account")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("name", equalTo("New Name"))
               .body("email", equalTo("new@cursos.dev"))
               .body("description", equalTo("Bio about teaching"));
    }

    @Test
    @DisplayName("shouldChangePasswordViaPassport")
    void shouldChangePasswordViaPassport() {
        var auth = Given.authenticated(user.id(), user.username(), user.name(), user.email());
        when(passportRestClient.changePassword(eq(auth.getValue()), any()))
                                                                           .thenReturn(Response.ok().build());

        given().header(auth)
               .contentType(ContentType.JSON)
               .body("""
                     {"currentPassword":"old-password","newPassword":"new-password"}
                     """)
               .when()
               .post("/api/account/change-password")
               .then()
               .statusCode(HttpStatus.SC_OK);
    }
}
