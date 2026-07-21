package dev.vepo.cursos.study;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

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
@DisplayName("Study accessibility endpoints")
class StudyAccessibilityEndpointTest {

    private PassportUser teacher;
    private PassportUser student;
    private Header teacherAuth;
    private Header studentAuth;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(10L, "teacher");
        student = Given.user(20L, "student");
        teacherAuth = Given.authenticated(teacher.id(), teacher.username(), teacher.name(), teacher.email());
        studentAuth = Given.authenticated(student.id(), student.username(), student.name(), student.email());
    }

    @Test
    @DisplayName("shouldExposeOrderedAulaTreeWithFirstAccessibleAndLaterLockedForEnrolledStudent")
    void shouldExposeOrderedAulaTreeWithFirstAccessibleAndLaterLockedForEnrolledStudent() {
        var course = Given.course(teacher, "Sequential Course", CourseStatus.PUBLISHED, null);
        var first = Given.markdownItem(course, "Intro", "# Intro");
        var second = Given.markdownItem(course, "Setup", "# Setup");
        var third = Given.markdownItem(course, "DI", "# DI");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/study", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("items", hasSize(3))
               .body("items[0].id", equalTo(first.getId().intValue()))
               .body("items[0].title", equalTo("Intro"))
               .body("items[0].sortOrder", equalTo(0))
               .body("items[0].completed", equalTo(false))
               .body("items[0].accessible", equalTo(true))
               .body("items[1].id", equalTo(second.getId().intValue()))
               .body("items[1].title", equalTo("Setup"))
               .body("items[1].sortOrder", equalTo(1))
               .body("items[1].completed", equalTo(false))
               .body("items[1].accessible", equalTo(false))
               .body("items[2].id", equalTo(third.getId().intValue()))
               .body("items[2].title", equalTo("DI"))
               .body("items[2].sortOrder", equalTo(2))
               .body("items[2].completed", equalTo(false))
               .body("items[2].accessible", equalTo(false));
    }

    @Test
    @DisplayName("shouldMakeLaterAulaAccessibleOnlyWhenAllPreviousAulasCompleted")
    void shouldMakeLaterAulaAccessibleOnlyWhenAllPreviousAulasCompleted() {
        var course = Given.course(teacher, "Unlock Course", CourseStatus.PUBLISHED, null);
        var first = Given.markdownItem(course, "Intro", "# Intro");
        var second = Given.markdownItem(course, "Setup", "# Setup");
        var third = Given.markdownItem(course, "DI", "# DI");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":true}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), first.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("completed", equalTo(true));

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/study", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("items[0].id", equalTo(first.getId().intValue()))
               .body("items[0].completed", equalTo(true))
               .body("items[0].accessible", equalTo(true))
               .body("items[1].id", equalTo(second.getId().intValue()))
               .body("items[1].completed", equalTo(false))
               .body("items[1].accessible", equalTo(true))
               .body("items[2].id", equalTo(third.getId().intValue()))
               .body("items[2].completed", equalTo(false))
               .body("items[2].accessible", equalTo(false));
    }

    @Test
    @DisplayName("shouldForbidLockedAulaContentAndProgressForEnrolledStudent")
    void shouldForbidLockedAulaContentAndProgressForEnrolledStudent() {
        var course = Given.course(teacher, "Locked Ops Course", CourseStatus.PUBLISHED, null);
        Given.markdownItem(course, "Intro", "# Intro");
        var second = Given.markdownItem(course, "Setup", "# Setup");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":true}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), second.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}", course.getId(), second.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("shouldRelockLaterAulasWhenEarlierAulaUncompleted")
    void shouldRelockLaterAulasWhenEarlierAulaUncompleted() {
        var course = Given.course(teacher, "Relock Course", CourseStatus.PUBLISHED, null);
        var first = Given.markdownItem(course, "Intro", "# Intro");
        var second = Given.markdownItem(course, "Setup", "# Setup");
        var third = Given.markdownItem(course, "DI", "# DI");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":true}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), first.getId())
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":true}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), second.getId())
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/study", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("items[2].accessible", equalTo(true));

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
               .body("items[0].accessible", equalTo(true))
               .body("items[1].completed", equalTo(false))
               .body("items[1].accessible", equalTo(false))
               .body("items[2].completed", equalTo(false))
               .body("items[2].accessible", equalTo(false));

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}", course.getId(), second.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":true}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), third.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);
    }

    @Test
    @DisplayName("shouldAllowCourseTeacherToBypassSequentialLock")
    void shouldAllowCourseTeacherToBypassSequentialLock() {
        var course = Given.course(teacher, "Teacher Preview Course", CourseStatus.PUBLISHED, null);
        Given.markdownItem(course, "Intro", "# Intro");
        var second = Given.markdownItem(course, "Setup", "# Setup body");
        var third = Given.markdownItem(course, "DI", "# DI body");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{courseId}/study", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("items", hasSize(3))
               .body("items[0].accessible", equalTo(true))
               .body("items[1].accessible", equalTo(true))
               .body("items[2].accessible", equalTo(true));

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}", course.getId(), second.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("id", equalTo(second.getId().intValue()))
               .body("blocks[0].markdownBody", equalTo("# Setup body"));

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}", course.getId(), third.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("id", equalTo(third.getId().intValue()))
               .body("blocks[0].markdownBody", equalTo("# DI body"));
    }
}
