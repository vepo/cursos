package dev.vepo.cursos.course.item.block;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

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
@DisplayName("Aula block endpoints")
class AulaBlockEndpointTest {

    private PassportUser teacher;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(91L, "block-teacher");
    }

    @Test
    @DisplayName("shouldAppendReorderAndRejectDeletingLastBlock")
    void shouldAppendReorderAndRejectDeletingLastBlock() {
        var teacherAuth = auth(teacher);
        int courseId = createDraftCourse(teacherAuth);

        int itemId = given().header(teacherAuth)
                            .contentType(ContentType.JSON)
                            .body("""
                                  {"title":"Mixed","markdownBody":"# First"}
                                  """)
                            .when()
                            .post("/api/courses/{id}/items/markdown", courseId)
                            .then()
                            .statusCode(HttpStatus.SC_OK)
                            .body("blocks", hasSize(1))
                            .body("blocks[0].blockType", equalTo("MARKDOWN"))
                            .extract()
                            .path("id");

        int firstBlockId = given().header(teacherAuth)
                                  .when()
                                  .get("/api/courses/{id}", courseId)
                                  .then()
                                  .statusCode(HttpStatus.SC_OK)
                                  .extract()
                                  .path("items[0].blocks[0].id");

        int secondBlockId = given().header(teacherAuth)
                                   .contentType(ContentType.JSON)
                                   .body("""
                                         {"linkUrl":"https://example.com/more","linkDescription":"More"}
                                         """)
                                   .when()
                                   .post("/api/courses/{courseId}/items/{itemId}/blocks/link", courseId, itemId)
                                   .then()
                                   .statusCode(HttpStatus.SC_OK)
                                   .body("blockType", equalTo("LINK"))
                                   .body("linkUrl", equalTo("https://example.com/more"))
                                   .extract()
                                   .path("id");

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"markdownBody":"# Updated first"}
                     """)
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/blocks/{blockId}/markdown", courseId, itemId, firstBlockId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("markdownBody", equalTo("# Updated first"));

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"blockIds":[%d,%d]}
                     """.formatted(secondBlockId, firstBlockId))
               .when()
               .post("/api/courses/{courseId}/items/{itemId}/blocks/reorder", courseId, itemId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("$", hasSize(2))
               .body("[0].id", equalTo(secondBlockId))
               .body("[0].blockType", equalTo("LINK"))
               .body("[1].id", equalTo(firstBlockId));

        given().header(teacherAuth)
               .when()
               .delete("/api/courses/{courseId}/items/{itemId}/blocks/{blockId}", courseId, itemId, firstBlockId)
               .then()
               .statusCode(HttpStatus.SC_NO_CONTENT);

        given().header(teacherAuth)
               .when()
               .delete("/api/courses/{courseId}/items/{itemId}/blocks/{blockId}", courseId, itemId, secondBlockId)
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{id}", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("items[0].blocks", hasSize(1))
               .body("items[0].blocks[0].id", equalTo(secondBlockId));
    }

    private int createDraftCourse(Header teacherAuth) {
        return given().header(teacherAuth)
                      .contentType(ContentType.JSON)
                      .body("""
                            {"title":"Block Course","summary":"Blocks","categoryIds":[]}
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
