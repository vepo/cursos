package dev.vepo.cursos.course.image;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

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
@DisplayName("Course image asset endpoints")
class CourseImageAssetEndpointTest {

    private static final byte[] TINY_PNG =
            new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, (byte) 0x90, 0x77, 0x53, (byte) 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, (byte) 0xD7, 0x63, (byte) 0xF8, (byte) 0xCF, (byte) 0xC0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, (byte) 0xFE, (byte) 0xD4, (byte) 0xEF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE, 0x42, 0x60, (byte) 0x82
            };

    private PassportUser teacher;
    private PassportUser student;
    private Header teacherAuth;
    private Header studentAuth;
    private int courseId;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(10L, "teacher");
        student = Given.user(20L, "student");
        teacherAuth = Given.authenticated(teacher.id(), teacher.username(), teacher.name(), teacher.email());
        studentAuth = Given.authenticated(student.id(), student.username(), student.name(), student.email());
        courseId = given().header(teacherAuth)
                          .contentType(ContentType.JSON)
                          .body("""
                                {"title":"Image Course","summary":"Covers","categoryIds":[]}
                                """)
                          .when()
                          .post("/api/courses")
                          .then()
                          .statusCode(HttpStatus.SC_OK)
                          .extract()
                          .path("id");
    }

    @Test
    @DisplayName("shouldAllowTeacherToUploadAndListGalleryImages")
    void shouldAllowTeacherToUploadAndListGalleryImages() {
        int assetId = uploadImage("cover.png");

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{id}/images", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("$", hasSize(1))
               .body("[0].id", equalTo(assetId))
               .body("[0].signedUrl", notNullValue());
    }

    @Test
    @DisplayName("shouldRejectUnsupportedMimeType")
    void shouldRejectUnsupportedMimeType() {
        given().header(teacherAuth)
               .multiPart("file", "note.txt", "hello".getBytes(), "text/plain")
               .when()
               .post("/api/courses/{id}/images", courseId)
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
    @DisplayName("shouldSetAndClearCourseCover")
    void shouldSetAndClearCourseCover() {
        int assetId = uploadImage("cover.png");

        given().header(teacherAuth)
               .when()
               .put("/api/courses/{id}/cover/{assetId}", courseId, assetId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("coverImageAssetId", equalTo(assetId))
               .body("coverImageUrl", notNullValue());

        given().header(teacherAuth)
               .when()
               .delete("/api/courses/{id}/cover", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("coverImageAssetId", equalTo(null));
    }

    @Test
    @DisplayName("shouldBlockDeleteWhenAssetIsCover")
    void shouldBlockDeleteWhenAssetIsCover() {
        int assetId = uploadImage("cover.png");
        given().header(teacherAuth)
               .when()
               .put("/api/courses/{id}/cover/{assetId}", courseId, assetId)
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(teacherAuth)
               .when()
               .delete("/api/courses/{id}/images/{assetId}", courseId, assetId)
               .then()
               .statusCode(HttpStatus.SC_CONFLICT);
    }

    @Test
    @DisplayName("shouldBlockDeleteWhenMarkdownReferencesAsset")
    void shouldBlockDeleteWhenMarkdownReferencesAsset() {
        int assetId = uploadImage("inline.png");
        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Lesson","markdownBody":"![Alt](course-asset:%d)"}
                     """.formatted(assetId))
               .when()
               .post("/api/courses/{id}/items/markdown", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(teacherAuth)
               .when()
               .delete("/api/courses/{id}/images/{assetId}", courseId, assetId)
               .then()
               .statusCode(HttpStatus.SC_CONFLICT);
    }

    @Test
    @DisplayName("shouldStreamImageWithValidSignedTicket")
    void shouldStreamImageWithValidSignedTicket() {
        int assetId = uploadImage("stream.png");
        String signedUrl = given().header(teacherAuth)
                                  .contentType(ContentType.JSON)
                                  .body("{\"assetIds\":[%d]}".formatted(assetId))
                                  .when()
                                  .post("/api/courses/{id}/images/tickets", courseId)
                                  .then()
                                  .statusCode(HttpStatus.SC_OK)
                                  .body("tickets", hasSize(1))
                                  .extract()
                                  .path("tickets[0].url");

        given().when()
               .get(signedUrl)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .header("Content-Type", equalTo("image/png"))
               .header("Content-Length", greaterThan("0"));
    }

    @Test
    @DisplayName("shouldDenyGalleryAccessForUnenrolledStudent")
    void shouldDenyGalleryAccessForUnenrolledStudent() {
        uploadImage("private.png");
        given().header(studentAuth)
               .when()
               .get("/api/courses/{id}/images", courseId)
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("shouldReorderAdjacentItemsWithoutUniqueConstraintFailure")
    void shouldReorderAdjacentItemsWithoutUniqueConstraintFailure() {
        int first = createMarkdown("A");
        int second = createMarkdown("B");

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("{\"itemIds\":[%d,%d]}".formatted(second, first))
               .when()
               .post("/api/courses/{id}/items/reorder", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("[0].id", equalTo(second))
               .body("[1].id", equalTo(first));
    }

    private int uploadImage(String filename) {
        return given().header(teacherAuth)
                      .multiPart("file", filename, TINY_PNG, "image/png")
                      .when()
                      .post("/api/courses/{id}/images", courseId)
                      .then()
                      .statusCode(HttpStatus.SC_OK)
                      .body("filename", equalTo(filename))
                      .extract()
                      .path("id");
    }

    private int createMarkdown(String title) {
        return given().header(teacherAuth)
                      .contentType(ContentType.JSON)
                      .body("""
                            {"title":"%s","markdownBody":"# %s"}
                            """.formatted(title, title))
                      .when()
                      .post("/api/courses/{id}/items/markdown", courseId)
                      .then()
                      .statusCode(HttpStatus.SC_OK)
                      .extract()
                      .path("id");
    }
}
