package dev.vepo.cursos.catalog;

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
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.Header;

@QuarkusTest
@DisplayName("Catalog endpoints")
class CatalogEndpointTest {

    private PassportUser teacher;
    private PassportUser student;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(100L, "cat-teacher");
        student = Given.user(101L, "cat-student");
    }

    @Test
    @DisplayName("shouldSplitTeachingEnrolledRequestedAndAvailableSections")
    void shouldSplitTeachingEnrolledRequestedAndAvailableSections() {
        var javaCategory = Given.category("Java", "java");
        var kotlinCategory = Given.category("Kotlin", "kotlin");
        var teacherAuth = auth(teacher);
        var studentAuth = auth(student);

        var teaching = Given.course(teacher, "Teaching Java", CourseStatus.PUBLISHED, List.of(javaCategory.getId()));
        var enrolledCourse = Given.course(Given.user(102L, "other-teacher"), "Enrolled course", CourseStatus.PUBLISHED, List.of(javaCategory.getId()));
        var requestedCourse = Given.course(Given.user(103L, "req-teacher"), "Requested course", CourseStatus.PUBLISHED, List.of(kotlinCategory.getId()));
        var availableCourse = Given.course(Given.user(104L, "avail-teacher"), "Available course", CourseStatus.PUBLISHED, List.of(javaCategory.getId()));
        var rejectedCourse = Given.course(Given.user(105L, "rej-teacher"), "Rejected course", CourseStatus.PUBLISHED, List.of(javaCategory.getId()));

        Given.enrollment(enrolledCourse, student, EnrollmentStatus.ENROLLED);
        Given.enrollment(requestedCourse, student, EnrollmentStatus.REQUESTED);
        Given.enrollment(rejectedCourse, student, EnrollmentStatus.REJECTED);

        given().header(studentAuth)
               .when()
               .get("/api/catalog/courses")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("teaching", hasSize(0))
               .body("enrolled", hasSize(2))
               .body("available", hasSize(3));

        given().header(teacherAuth)
               .when()
               .get("/api/catalog/courses")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("teaching", hasSize(1))
               .body("teaching[0].id", equalTo(teaching.getId().intValue()));

        given().header(studentAuth)
               .queryParam("category", "java")
               .when()
               .get("/api/catalog/courses")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("enrolled", hasSize(1))
               .body("enrolled[0].id", equalTo(enrolledCourse.getId().intValue()))
               .body("available", hasSize(3));

        given().header(studentAuth)
               .queryParam("category", "kotlin")
               .when()
               .get("/api/catalog/courses")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("enrolled", hasSize(1))
               .body("enrolled[0].id", equalTo(requestedCourse.getId().intValue()))
               .body("enrolled[0].section", equalTo("requested"))
               .body("available", hasSize(0));

        given().header(studentAuth)
               .when()
               .get("/api/catalog/courses")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("available.find { it.id == %d }.id".formatted(availableCourse.getId()), equalTo(availableCourse.getId().intValue()))
               .body("available.find { it.id == %d }.id".formatted(rejectedCourse.getId()), equalTo(rejectedCourse.getId().intValue()));
    }

    private Header auth(PassportUser user) {
        return Given.authenticated(user.id(), user.username(), user.name(), user.email());
    }
}
