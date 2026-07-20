package dev.vepo.cursos.enrollment;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import java.util.List;

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.http.Header;

@QuarkusTest
@DisplayName("Enrollment endpoints")
class EnrollmentEndpointTest {

    private PassportUser teacher;
    private PassportUser student;
    private PassportUser stranger;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(70L, "enroll-teacher");
        student = Given.user(71L, "enroll-student");
        stranger = Given.user(72L, "enroll-stranger");
    }

    @Test
    @DisplayName("shouldRejectEnrollmentRequestForDraftCourse")
    void shouldRejectEnrollmentRequestForDraftCourse() {
        var teacherAuth = auth(teacher);
        var studentAuth = auth(student);
        var course = Given.course(teacher, "Draft only", CourseStatus.DRAFT, List.of());

        given().header(studentAuth)
               .when()
               .post("/api/courses/{id}/enrollments/request", course.getId())
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/enrollments/request", course.getId())
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
    @DisplayName("shouldRejectTeacherSelfEnrollmentOnPublishedCourse")
    void shouldRejectTeacherSelfEnrollmentOnPublishedCourse() {
        var teacherAuth = auth(teacher);
        var course = Given.course(teacher, "Published", CourseStatus.PUBLISHED, List.of());

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/enrollments/request", course.getId())
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
    @DisplayName("shouldConflictWhenEnrollmentAlreadyRequestedAndReopenRejected")
    void shouldConflictWhenEnrollmentAlreadyRequestedAndReopenRejected() {
        var teacherAuth = auth(teacher);
        var studentAuth = auth(student);
        var course = Given.course(teacher, "Published", CourseStatus.PUBLISHED, List.of());

        int enrollmentId = given().header(studentAuth)
                                  .when()
                                  .post("/api/courses/{id}/enrollments/request", course.getId())
                                  .then()
                                  .statusCode(HttpStatus.SC_OK)
                                  .body("status", equalTo("REQUESTED"))
                                  .extract()
                                  .path("id");

        given().header(studentAuth)
               .when()
               .post("/api/courses/{id}/enrollments/request", course.getId())
               .then()
               .statusCode(HttpStatus.SC_CONFLICT);

        given().header(teacherAuth)
               .when()
               .post("/api/enrollments/{id}/reject", enrollmentId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("REJECTED"));

        given().header(studentAuth)
               .when()
               .post("/api/courses/{id}/enrollments/request", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("REQUESTED"))
               .body("id", equalTo(enrollmentId));
    }

    @Test
    @DisplayName("shouldRefuseApproveAndRejectWhenNotRequested")
    void shouldRefuseApproveAndRejectWhenNotRequested() {
        var teacherAuth = auth(teacher);
        var studentAuth = auth(student);
        var course = Given.course(teacher, "Published", CourseStatus.PUBLISHED, List.of());
        var enrollment = Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(teacherAuth)
               .when()
               .post("/api/enrollments/{id}/approve", enrollment.getId())
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().header(teacherAuth)
               .when()
               .post("/api/enrollments/{id}/reject", enrollment.getId())
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().header(studentAuth)
               .when()
               .post("/api/enrollments/{id}/approve", enrollment.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("shouldDirectEnrollAndListCourseEnrollmentsForTeacherOnly")
    void shouldDirectEnrollAndListCourseEnrollmentsForTeacherOnly() {
        var teacherAuth = auth(teacher);
        var studentAuth = auth(student);
        var course = Given.course(teacher, "Published", CourseStatus.PUBLISHED, List.of());

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"passportUserId":%d,"username":"%s","name":"%s","email":"%s"}
                     """.formatted(student.id(), student.username(), student.name(), student.email()))
               .when()
               .post("/api/courses/{id}/enrollments", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("ENROLLED"))
               .body("studentPassportUserId", equalTo((int) student.id()));

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"passportUserId":%d,"username":"%s","name":"%s","email":"%s"}
                     """.formatted(student.id(), student.username(), student.name(), student.email()))
               .when()
               .post("/api/courses/{id}/enrollments", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("ENROLLED"));

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{id}/enrollments", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("", hasSize(1))
               .body("[0].studentUsername", equalTo(student.username()));

        given().header(studentAuth)
               .when()
               .get("/api/courses/{id}/enrollments", course.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);
    }

    private Header auth(PassportUser user) {
        return Given.authenticated(user.id(), user.username(), user.name(), user.email());
    }
}
