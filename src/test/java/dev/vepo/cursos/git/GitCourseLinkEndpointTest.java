package dev.vepo.cursos.git;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

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
@DisplayName("Git link status unlink endpoints")
class GitCourseLinkEndpointTest {

    private PassportUser teacher;
    private PassportUser stranger;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(110L, "git-teacher");
        stranger = Given.user(111L, "git-stranger");
    }

    @Test
    @DisplayName("shouldLinkUpdateStatusAndUnlinkGitRepositoryForTeacher")
    void shouldLinkUpdateStatusAndUnlinkGitRepositoryForTeacher() {
        var teacherAuth = auth(teacher);
        var strangerAuth = auth(stranger);
        var course = Given.course(teacher, "Git course", CourseStatus.DRAFT, List.of());

        given().header(strangerAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"remoteUrl":"https://example.com/repo.git","defaultBranch":"main","descriptionPath":"course.yml"}
                     """)
               .when()
               .post("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"remoteUrl":"https://example.com/repo.git","defaultBranch":"main","descriptionPath":"course.yml"}
                     """)
               .when()
               .post("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("remoteUrl", equalTo("https://example.com/repo.git"))
               .body("defaultBranch", equalTo("main"))
               .body("descriptionPath", equalTo("course.yml"));

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"remoteUrl":"https://example.com/other.git","defaultBranch":"develop","descriptionPath":"docs/course.yml"}
                     """)
               .when()
               .post("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("remoteUrl", equalTo("https://example.com/other.git"))
               .body("defaultBranch", equalTo("develop"))
               .body("descriptionPath", equalTo("docs/course.yml"));

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("remoteUrl", equalTo("https://example.com/other.git"));

        given().header(teacherAuth)
               .when()
               .delete("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_NO_CONTENT);

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_NOT_FOUND);

        given().header(teacherAuth)
               .when()
               .delete("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_NOT_FOUND);
    }

    private Header auth(PassportUser user) {
        return Given.authenticated(user.id(), user.username(), user.name(), user.email());
    }
}
