package dev.vepo.cursos.course;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;

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
@DisplayName("Course platform endpoints")
class CoursePlatformEndpointTest {

    private PassportUser teacher;
    private PassportUser student;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(10L, "teacher");
        student = Given.user(20L, "student");
    }

    @Test
    @DisplayName("shouldCreatePublishCatalogAndEnrollWithProgress")
    void shouldCreatePublishCatalogAndEnrollWithProgress() {
        var category = Given.category("Java", "java");
        var teacherAuth = Given.authenticated(teacher.id(), teacher.username(), teacher.name(), teacher.email());
        var studentAuth = Given.authenticated(student.id(), student.username(), student.name(), student.email());

        int courseId = given().header(teacherAuth)
                              .contentType(ContentType.JSON)
                              .body("""
                                    {"title":"Quarkus 101","summary":"Intro","categoryIds":[%d]}
                                    """.formatted(category.getId()))
                              .when()
                              .post("/api/courses")
                              .then()
                              .statusCode(HttpStatus.SC_OK)
                              .body("title", equalTo("Quarkus 101"))
                              .body("status", equalTo("DRAFT"))
                              .extract()
                              .path("id");

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"title":"Welcome","markdownBody":"# Hi"}
                     """)
               .when()
               .post("/api/courses/{id}/items/markdown", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("itemType", equalTo("MARKDOWN"));

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/publish", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("PUBLISHED"));

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/unpublish", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("DRAFT"));

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/publish", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("PUBLISHED"));

        given().header(studentAuth)
               .when()
               .get("/api/catalog/courses")
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("available", hasSize(greaterThanOrEqualTo(1)));

        int enrollmentId = given().header(studentAuth)
                                  .when()
                                  .post("/api/courses/{id}/enrollments/request", courseId)
                                  .then()
                                  .statusCode(HttpStatus.SC_OK)
                                  .body("status", equalTo("REQUESTED"))
                                  .extract()
                                  .path("id");

        given().header(teacherAuth)
               .when()
               .post("/api/enrollments/{id}/approve", enrollmentId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo(EnrollmentStatus.ENROLLED.name()));

        int itemId = given().header(studentAuth)
                            .when()
                            .get("/api/courses/{id}", courseId)
                            .then()
                            .statusCode(HttpStatus.SC_OK)
                            .extract()
                            .path("items[0].id");

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":true}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", courseId, itemId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("completed", equalTo(true));

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{id}/progress", courseId)
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("[0].completedItems", equalTo(1))
               .body("[0].percentComplete", equalTo(100.0f));
    }
}
