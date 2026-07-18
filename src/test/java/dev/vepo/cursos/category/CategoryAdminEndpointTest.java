package dev.vepo.cursos.category;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;

import java.util.Set;

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.http.Header;

@QuarkusTest
@DisplayName("Category admin authorization (T17)")
class CategoryAdminEndpointTest {

    private static final String CURSOS_ADMIN = "cursos.admin";

    private PassportUser student;
    private PassportUser admin;
    private Header studentAuth;
    private Header adminAuth;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        student = Given.user(20L, "student");
        admin = Given.user(10L, "cursos-admin");
        studentAuth = Given.authenticated(student.id(), student.username(), student.name(), student.email());
        adminAuth = Given.authenticated(admin.id(),
                                        admin.username(),
                                        admin.name(),
                                        admin.email(),
                                        Set.of("USER", CURSOS_ADMIN));
    }

    @Test
    @DisplayName("shouldRejectCategoryCreateWhenAuthenticatedWithoutCursosAdmin")
    void shouldRejectCategoryCreateWhenAuthenticatedWithoutCursosAdmin() {
        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"name":"Forbidden Cat","slug":"forbidden-cat"}
                     """)
               .when()
               .post("/api/categories")
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("shouldAcceptCategoryCreateWhenAuthenticatedWithCursosAdmin")
    void shouldAcceptCategoryCreateWhenAuthenticatedWithCursosAdmin() {
        given().header(adminAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"name":"Admin Cat","slug":"admin-cat"}
                     """)
               .when()
               .post("/api/categories")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("name", equalTo("Admin Cat"))
               .body("slug", equalTo("admin-cat"));
    }

    @Test
    @DisplayName("shouldListCategoriesWhenAuthenticatedWithoutCursosAdmin")
    void shouldListCategoriesWhenAuthenticatedWithoutCursosAdmin() {
        Given.category("Visible", "visible");

        given().header(studentAuth)
               .when()
               .get("/api/categories")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("slug", hasItem("visible"));
    }
}
