package dev.vepo.cursos.course;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.startsWith;

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;

@QuarkusTest
@DisplayName("Link and video aulas")
class LinkAndVideoAulaEndpointTest {

    private PassportUser teacher;
    private PassportUser student;
    private PassportUser stranger;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(40L, "link-teacher");
        student = Given.user(41L, "link-student");
        stranger = Given.user(42L, "link-stranger");
    }

    @Test
    @DisplayName("shouldCreateSafeLinkAulaAndRejectUnsafeSchemes")
    void shouldCreateSafeLinkAulaAndRejectUnsafeSchemes() {
        var teacherAuth = Given.authenticated(teacher.id(), teacher.username(), teacher.name(), teacher.email());
        int courseId = createDraftCourse(teacherAuth);

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Docs","linkUrl":"javascript:alert(1)","linkDescription":"bad"}
                     """)
               .when()
               .post("/api/courses/{id}/items/link", courseId)
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Docs","linkUrl":"https://example.com/guide","linkDescription":"Official guide"}
                     """)
               .when()
               .post("/api/courses/{id}/items/link", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("itemType", equalTo("LINK"))
               .body("linkUrl", equalTo("https://example.com/guide"))
               .body("linkDescription", equalTo("Official guide"));
    }

    @Test
    @DisplayName("shouldIssuePlaybackTicketAndServeRangeForEnrolledStudent")
    void shouldIssuePlaybackTicketAndServeRangeForEnrolledStudent() {
        var teacherAuth = Given.authenticated(teacher.id(), teacher.username(), teacher.name(), teacher.email());
        var studentAuth = Given.authenticated(student.id(), student.username(), student.name(), student.email());
        var strangerAuth = Given.authenticated(stranger.id(), stranger.username(), stranger.name(), stranger.email());
        int courseId = createDraftCourse(teacherAuth);

        byte[] video = new byte[64];
        for (int i = 0; i < video.length; i++) {
            video[i] = (byte) i;
        }

        int itemId = given().header(teacherAuth)
                            .multiPart("title", "Intro video")
                            .multiPart("type", "VIDEO")
                            .multiPart("file", "clip.mp4", video, "video/mp4")
                            .when()
                            .post("/api/courses/{id}/items/media", courseId)
                            .then()
                            .statusCode(HttpStatus.SC_OK)
                            .body("itemType", equalTo("VIDEO"))
                            .body("resourceId", notNullValue())
                            .extract()
                            .path("id");

        int resourceId = given().header(teacherAuth)
                                .when()
                                .get("/api/courses/{id}", courseId)
                                .then()
                                .statusCode(HttpStatus.SC_OK)
                                .extract()
                                .path("items[0].resourceId");

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/publish", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK);

        int enrollmentId = given().header(studentAuth)
                                  .when()
                                  .post("/api/courses/{id}/enrollments/request", courseId)
                                  .then()
                                  .statusCode(HttpStatus.SC_OK)
                                  .extract()
                                  .path("id");

        given().header(teacherAuth)
               .when()
               .post("/api/enrollments/{id}/approve", enrollmentId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo(EnrollmentStatus.ENROLLED.name()));

        given().header(strangerAuth)
               .when()
               .post("/api/courses/{courseId}/items/{itemId}/playback-ticket", courseId, itemId)
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        String url = given().header(studentAuth)
                            .when()
                            .post("/api/courses/{courseId}/items/{itemId}/playback-ticket", courseId, itemId)
                            .then()
                            .statusCode(HttpStatus.SC_OK)
                            .body("url", startsWith("/api/media/playback/"))
                            .extract()
                            .path("url");

        given().header("Range", "bytes=0-9")
               .when()
               .get(url)
               .then()
               .statusCode(HttpStatus.SC_PARTIAL_CONTENT)
               .header("Accept-Ranges", equalTo("bytes"))
               .header("Content-Range", equalTo("bytes 0-9/64"))
               .header("Content-Type", equalTo("video/mp4"));

        given().header("Range", "bytes=-10")
               .when()
               .get(url)
               .then()
               .statusCode(HttpStatus.SC_PARTIAL_CONTENT)
               .header("Content-Range", equalTo("bytes 54-63/64"));

        given().header("Range", "bytes=10-")
               .when()
               .get(url)
               .then()
               .statusCode(HttpStatus.SC_PARTIAL_CONTENT)
               .header("Content-Range", equalTo("bytes 10-63/64"));

        given().when()
               .get(url)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .header("Accept-Ranges", equalTo("bytes"))
               .header("Content-Type", equalTo("video/mp4"));

        given().header("Range", "bytes=0-1,2-3")
               .when()
               .get(url)
               .then()
               .statusCode(HttpStatus.SC_REQUESTED_RANGE_NOT_SATISFIABLE);

        given().header("Range", "bytes=1000-1001")
               .when()
               .get(url)
               .then()
               .statusCode(HttpStatus.SC_REQUESTED_RANGE_NOT_SATISFIABLE);

        given().when()
               .get("/api/courses/{courseId}/resources/{resourceId}", courseId + 1, resourceId)
               .then()
               .statusCode(HttpStatus.SC_UNAUTHORIZED);
    }

    private int createDraftCourse(io.restassured.http.Header teacherAuth) {
        return given().header(teacherAuth)
                      .contentType(ContentType.JSON)
                      .body("""
                            {"title":"Media course","summary":"Links and video","categoryIds":[]}
                            """)
                      .when()
                      .post("/api/courses")
                      .then()
                      .statusCode(HttpStatus.SC_OK)
                      .extract()
                      .path("id");
    }
}
