package dev.vepo.cursos.progress.certificate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.http.Header;

@QuarkusTest
@DisplayName("Course certificate and cascade progress")
class CourseCertificateEndpointTest {

    private PassportUser teacher;
    private PassportUser student;
    private Header studentAuth;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(10L, "teacher");
        student = Given.user(20L, "student");
        studentAuth = Given.authenticated(student.id(), student.username(), student.name(), student.email());
    }

    @Test
    @DisplayName("shouldCascadeClearLaterAulasAndClearConclusionOnRollback")
    void shouldCascadeClearLaterAulasAndClearConclusionOnRollback() {
        var course = Given.course(teacher, "Cascade Course", CourseStatus.PUBLISHED, null);
        var first = Given.markdownItem(course, "Intro", "# Intro");
        var second = Given.markdownItem(course, "Setup", "# Setup");
        Given.markdownItem(course, "DI", "# DI");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        complete(course.getId(), first.getId());
        complete(course.getId(), second.getId());

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":false}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), first.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("completed", equalTo(false));

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/study", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("items[0].completed", equalTo(false))
               .body("items[1].completed", equalTo(false))
               .body("items[2].completed", equalTo(false))
               .body("concluded", equalTo(false))
               .body("completedItems", equalTo(0));
    }

    @Test
    @DisplayName("shouldAllowCertificateDownloadOnlyWhenCourseIsConcluded")
    void shouldAllowCertificateDownloadOnlyWhenCourseIsConcluded() {
        var course = Given.course(teacher, "Certificate Course", CourseStatus.PUBLISHED, null);
        var first = Given.markdownItem(course, "Intro", "# Intro");
        var second = Given.markdownItem(course, "Setup", "# Setup");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/certificate", course.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        complete(course.getId(), first.getId());
        complete(course.getId(), second.getId());

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/study", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("concluded", equalTo(true))
               .body("percentComplete", equalTo(100.0f));

        var bytes = given().header(studentAuth)
                           .when()
                           .get("/api/courses/{courseId}/certificate", course.getId())
                           .then()
                           .statusCode(HttpStatus.SC_OK)
                           .header("Content-Type", startsWith("application/pdf"))
                           .header("Content-Disposition", startsWith("attachment;"))
                           .extract()
                           .asByteArray();
        assertTrue(bytes.length > 4);
        assertTrue(new String(bytes, 0, 4).equals("%PDF"));

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":false}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), second.getId())
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/certificate", course.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);
    }

    private void complete(long courseId, long itemId) {
        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":true}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", courseId, itemId)
               .then()
               .statusCode(HttpStatus.SC_OK);
    }
}
