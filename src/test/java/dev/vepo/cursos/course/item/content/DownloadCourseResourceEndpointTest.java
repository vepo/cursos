package dev.vepo.cursos.course.item.content;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.http.Header;

@QuarkusTest
@DisplayName("Download course resource endpoint")
class DownloadCourseResourceEndpointTest {

    private PassportUser teacher;
    private PassportUser student;
    private PassportUser stranger;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(80L, "dl-teacher");
        student = Given.user(81L, "dl-student");
        stranger = Given.user(82L, "dl-stranger");
    }

    @Test
    @DisplayName("shouldAllowTeacherEnrolledAndPublishedDownloadPaths")
    void shouldAllowTeacherEnrolledAndPublishedDownloadPaths() {
        var teacherAuth = auth(teacher);
        var studentAuth = auth(student);
        var strangerAuth = auth(stranger);
        int courseId = createDraftCourse(teacherAuth);
        int resourceId = uploadVideo(teacherAuth, courseId);

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{courseId}/resources/{resourceId}", courseId, resourceId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .header("Content-Type", equalTo("video/mp4"))
               .header("Content-Disposition", equalTo("inline; filename=\"clip.mp4\""));

        given().header(strangerAuth)
               .when()
               .get("/api/courses/{courseId}/resources/{resourceId}", courseId, resourceId)
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/publish", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(strangerAuth)
               .when()
               .get("/api/courses/{courseId}/resources/{resourceId}", courseId, resourceId)
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

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/unpublish", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/resources/{resourceId}", courseId, resourceId)
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{courseId}/resources/{resourceId}", courseId, resourceId + 9999)
               .then()
               .statusCode(HttpStatus.SC_NOT_FOUND);
    }

    private int createDraftCourse(Header teacherAuth) {
        return given().header(teacherAuth)
                      .contentType(ContentType.JSON)
                      .body("""
                            {"title":"Download course","summary":"Resources","categoryIds":[]}
                            """)
                      .when()
                      .post("/api/courses")
                      .then()
                      .statusCode(HttpStatus.SC_OK)
                      .extract()
                      .path("id");
    }

    private int uploadVideo(Header teacherAuth, int courseId) {
        byte[] video = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 };
        given().header(teacherAuth)
               .multiPart("title", "Intro video")
               .multiPart("type", "VIDEO")
               .multiPart("file", "clip.mp4", video, "video/mp4")
               .when()
               .post("/api/courses/{id}/items/media", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("blocks[0].resourceId", notNullValue());

        return given().header(teacherAuth)
                      .when()
                      .get("/api/courses/{id}", courseId)
                      .then()
                      .statusCode(HttpStatus.SC_OK)
                      .extract()
                      .path("items[0].blocks[0].resourceId");
    }

    private Header auth(PassportUser user) {
        return Given.authenticated(user.id(), user.username(), user.name(), user.email());
    }
}
