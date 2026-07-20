package dev.vepo.cursos.git;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.http.Header;

@QuarkusTest
@DisplayName("Git course sync")
class GitCourseSyncEndpointTest {

    @TempDir
    Path tempDir;

    private PassportUser teacher;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(120L, "sync-teacher");
    }

    @Test
    @DisplayName("shouldSyncMarkdownItemsFromLocalGitRepository")
    void shouldSyncMarkdownItemsFromLocalGitRepository() throws Exception {
        var teacherAuth = auth(teacher);
        var course = Given.course(teacher, "Before sync", CourseStatus.DRAFT, java.util.List.of());
        var remoteUrl = createLocalCourseRepo();

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"remoteUrl":"%s","defaultBranch":"main","descriptionPath":"course.yml"}
                     """.formatted(remoteUrl))
               .when()
               .post("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/git/sync", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("SYNCED"))
               .body("lastSyncedSha", notNullValue());

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{id}", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("course.title", equalTo("Synced Course"))
               .body("course.summary", equalTo("From git"))
               .body("course.categories.name", org.hamcrest.Matchers.hasItem("Git Category"))
               .body("items.size()", equalTo(1))
               .body("items[0].itemType", equalTo("MARKDOWN"))
               .body("items[0].title", equalTo("Welcome"))
               .body("items[0].markdownBody", equalTo("# Hello from git\n"));

        // second sync updates existing markdown item
        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/git/sync", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("status", equalTo("SYNCED"));
    }

    @Test
    @DisplayName("shouldRejectSyncWhenCourseYmlIsMissing")
    void shouldRejectSyncWhenCourseYmlIsMissing() throws Exception {
        var teacherAuth = auth(teacher);
        var course = Given.course(teacher, "Missing yml", CourseStatus.DRAFT, java.util.List.of());
        var repo = tempDir.resolve("empty-repo");
        Files.createDirectories(repo);
        Files.writeString(repo.resolve("readme.md"), "no course.yml\n", StandardCharsets.UTF_8);
        run(repo, "git", "init", "-b", "main");
        run(repo, "git", "config", "user.email", "sync@cursos.test");
        run(repo, "git", "config", "user.name", "Sync Test");
        run(repo, "git", "add", ".");
        run(repo, "git", "commit", "-m", "readme only");

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"remoteUrl":"%s","defaultBranch":"main","descriptionPath":"course.yml"}
                     """.formatted(repo.toUri()))
               .when()
               .post("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/git/sync", course.getId())
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
    @DisplayName("shouldMarkFailedWhenRemoteCannotBeCloned")
    void shouldMarkFailedWhenRemoteCannotBeCloned() {
        var teacherAuth = auth(teacher);
        var course = Given.course(teacher, "Broken remote", CourseStatus.DRAFT, java.util.List.of());

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("""
                     {"remoteUrl":"file:///tmp/cursos-missing-repo-%d.git","defaultBranch":"main","descriptionPath":"course.yml"}
                     """.formatted(System.nanoTime()))
               .when()
               .post("/api/courses/{id}/git", course.getId())
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(teacherAuth)
               .when()
               .post("/api/courses/{id}/git/sync", course.getId())
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    private String createLocalCourseRepo() throws IOException, InterruptedException {
        var repo = tempDir.resolve("course-repo");
        Files.createDirectories(repo);
        Files.writeString(repo.resolve("course.yml"), """
                                                      title: Synced Course
                                                      summary: From git
                                                      categories:
                                                        - Git Category
                                                      items:
                                                        - path: lessons/welcome.md
                                                          type: markdown
                                                          title: Welcome
                                                      """, StandardCharsets.UTF_8);
        Files.createDirectories(repo.resolve("lessons"));
        Files.writeString(repo.resolve("lessons/welcome.md"), "# Hello from git\n", StandardCharsets.UTF_8);

        run(repo, "git", "init", "-b", "main");
        run(repo, "git", "config", "user.email", "sync@cursos.test");
        run(repo, "git", "config", "user.name", "Sync Test");
        run(repo, "git", "add", ".");
        run(repo, "git", "commit", "-m", "initial course");
        return repo.toUri().toString();
    }

    private static void run(Path dir, String... command) throws IOException, InterruptedException {
        var process = new ProcessBuilder(command).directory(dir.toFile())
                                                 .redirectErrorStream(true)
                                                 .start();
        var output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        if (process.waitFor() != 0) {
            throw new IOException("Command failed: %s%n%s".formatted(String.join(" ", command), output));
        }
    }

    private Header auth(PassportUser user) {
        return Given.authenticated(user.id(), user.username(), user.name(), user.email());
    }
}
