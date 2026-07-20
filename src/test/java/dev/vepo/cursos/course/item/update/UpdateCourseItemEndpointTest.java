package dev.vepo.cursos.course.item.update;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

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
@DisplayName("Update course item endpoints")
class UpdateCourseItemEndpointTest {

    private PassportUser teacher;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(90L, "upd-teacher");
    }

    @Test
    @DisplayName("shouldUpdateLinkAndMarkdownItemsAndRejectMismatches")
    void shouldUpdateLinkAndMarkdownItemsAndRejectMismatches() {
        var teacherAuth = auth(teacher);
        int courseId = createDraftCourse(teacherAuth);

        int linkItemId = given().header(teacherAuth)
                                .contentType(ContentType.JSON)
                                .body("""
                                      {"title":"Docs","linkUrl":"https://example.com/old","linkDescription":"old"}
                                      """)
                                .when()
                                .post("/api/courses/{id}/items/link", courseId)
                                .then()
                                .statusCode(HttpStatus.SC_OK)
                                .extract()
                                .path("id");

        int markdownItemId = given().header(teacherAuth)
                                    .contentType(ContentType.JSON)
                                    .body("""
                                          {"title":"Welcome","markdownBody":"# Hi"}
                                          """)
                                    .when()
                                    .post("/api/courses/{id}/items/markdown", courseId)
                                    .then()
                                    .statusCode(HttpStatus.SC_OK)
                                    .extract()
                                    .path("id");

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Docs v2","linkUrl":"https://example.com/new","linkDescription":"updated"}
                     """)
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/link", courseId, linkItemId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("title", equalTo("Docs v2"))
               .body("linkUrl", equalTo("https://example.com/new"))
               .body("linkDescription", equalTo("updated"));

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Docs","linkUrl":"javascript:alert(1)","linkDescription":"bad"}
                     """)
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/link", courseId, linkItemId)
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Nope","linkUrl":"https://example.com","linkDescription":"x"}
                     """)
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/link", courseId, markdownItemId)
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Welcome v2","markdownBody":"# Hello"}
                     """)
               .when()
               .put("/api/courses/{courseId}/items/{itemId}", courseId, markdownItemId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("title", equalTo("Welcome v2"))
               .body("markdownBody", equalTo("# Hello"));

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Nope","markdownBody":"# x"}
                     """)
               .when()
               .put("/api/courses/{courseId}/items/{itemId}", courseId, linkItemId)
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Docs","linkUrl":"https://example.com","linkDescription":"x"}
                     """)
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/link", courseId + 1, linkItemId)
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    private int createDraftCourse(Header teacherAuth) {
        return given().header(teacherAuth)
                      .contentType(ContentType.JSON)
                      .body("""
                            {"title":"Update course","summary":"Items","categoryIds":[]}
                            """)
                      .when()
                      .post("/api/courses")
                      .then()
                      .statusCode(HttpStatus.SC_OK)
                      .extract()
                      .path("id");
    }

    private Header auth(PassportUser user) {
        return Given.authenticated(user.id(), user.username(), user.name(), user.email());
    }
}
