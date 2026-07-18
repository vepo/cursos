package dev.vepo.cursos.discussion;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import org.apache.http.HttpStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.tngtech.archunit.core.importer.ClassFileImporter;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import io.restassured.http.Header;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;

@QuarkusTest
@DisplayName("Aula discussion endpoints")
class DiscussionEndpointTest {

    @Inject
    CommentRepository commentRepository;

    @Inject
    CommentUpvoteRepository commentUpvoteRepository;

    private PassportUser teacher;
    private PassportUser student;
    private PassportUser outsider;
    private Header teacherAuth;
    private Header studentAuth;
    private Header outsiderAuth;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(10L, "teacher");
        student = Given.user(20L, "student");
        outsider = Given.user(30L, "outsider");
        teacherAuth = Given.authenticated(teacher.id(), teacher.username(), teacher.name(), teacher.email());
        studentAuth = Given.authenticated(student.id(), student.username(), student.name(), student.email());
        outsiderAuth = Given.authenticated(outsider.id(), outsider.username(), outsider.name(), outsider.email());
    }

    @Test
    @DisplayName("shouldAllowEnrolledStudentAndTeacherToCreateAndListCommentsOnAccessibleAula")
    void shouldAllowEnrolledStudentAndTeacherToCreateAndListCommentsOnAccessibleAula() {
        var course = Given.course(teacher, "Discussion Access Course", CourseStatus.PUBLISHED, null);
        var aula = Given.markdownItem(course, "Intro", "# Intro");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"content\":\"Student comment\"}")
               .when()
               .post("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), aula.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("content", equalTo("Student comment"))
               .body("authorUsername", equalTo(student.username()))
               .body("hidden", equalTo(false))
               .body("count", equalTo(0))
               .body("callerUpvoted", equalTo(false));

        given().header(teacherAuth)
               .contentType(ContentType.JSON)
               .body("{\"content\":\"Teacher comment\"}")
               .when()
               .post("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), aula.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("content", equalTo("Teacher comment"))
               .body("authorUsername", equalTo(teacher.username()));

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), aula.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("$", hasSize(2))
               .body("[0].content", equalTo("Student comment"))
               .body("[1].content", equalTo("Teacher comment"));
    }

    @Test
    @DisplayName("shouldForbidCommentAccessForOutsiderAndRejectBlankCommentBody")
    void shouldForbidCommentAccessForOutsiderAndRejectBlankCommentBody() {
        var course = Given.course(teacher, "Forbidden Discussion Course", CourseStatus.PUBLISHED, null);
        var aula = Given.markdownItem(course, "Intro", "# Intro");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(outsiderAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), aula.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(outsiderAuth)
               .contentType(ContentType.JSON)
               .body("{\"content\":\"Nope\"}")
               .when()
               .post("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), aula.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"content\":\"   \"}")
               .when()
               .post("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), aula.getId())
               .then()
               .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
    @DisplayName("shouldOmitHiddenCommentsForStudentAndExposeHiddenStateForTeacher")
    void shouldOmitHiddenCommentsForStudentAndExposeHiddenStateForTeacher() {
        var course = Given.course(teacher, "Moderation Visibility Course", CourseStatus.PUBLISHED, null);
        var aula = Given.markdownItem(course, "Intro", "# Intro");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        var visible = QuarkusTransaction.requiringNew()
                                        .call(() -> commentRepository.save(new Comment(aula, student, "Visible comment")));
        var hidden = QuarkusTransaction.requiringNew()
                                       .call(() -> {
                                           var comment = commentRepository.save(new Comment(aula, student, "Hidden comment"));
                                           comment.hide(teacher);
                                           return commentRepository.save(comment);
                                       });

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), aula.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("$", hasSize(1))
               .body("[0].id", equalTo(visible.getId().intValue()))
               .body("[0].content", equalTo("Visible comment"))
               .body("[0].hidden", equalTo(false));

        given().header(teacherAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), aula.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("$", hasSize(2))
               .body("find { it.id == %d }.hidden".formatted(visible.getId()), equalTo(false))
               .body("find { it.id == %d }.hidden".formatted(hidden.getId()), equalTo(true))
               .body("find { it.id == %d }.content".formatted(hidden.getId()), equalTo("Hidden comment"));
    }

    @Test
    @DisplayName("shouldToggleCallerUpvoteAndReturnCountWithCallerUpvoted")
    void shouldToggleCallerUpvoteAndReturnCountWithCallerUpvoted() {
        var course = Given.course(teacher, "Upvote Course", CourseStatus.PUBLISHED, null);
        var aula = Given.markdownItem(course, "Intro", "# Intro");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);
        var comment = QuarkusTransaction.requiringNew()
                                        .call(() -> commentRepository.save(new Comment(aula, teacher, "Upvotable")));

        given().header(studentAuth)
               .when()
               .post("/api/comments/{id}/upvote", comment.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("id", equalTo(comment.getId().intValue()))
               .body("count", equalTo(1))
               .body("callerUpvoted", equalTo(true));

        assertThat(commentUpvoteRepository.findByCommentAndVoter(comment.getId(), student.id())).isPresent();

        given().header(studentAuth)
               .when()
               .post("/api/comments/{id}/upvote", comment.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("count", equalTo(0))
               .body("callerUpvoted", equalTo(false));

        assertThat(commentUpvoteRepository.findByCommentAndVoter(comment.getId(), student.id())).isEmpty();
    }

    @Test
    @DisplayName("shouldAllowOnlyCourseTeacherToHideAndRestoreComments")
    void shouldAllowOnlyCourseTeacherToHideAndRestoreComments() {
        var course = Given.course(teacher, "Hide Restore Course", CourseStatus.PUBLISHED, null);
        var aula = Given.markdownItem(course, "Intro", "# Intro");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);
        var comment = QuarkusTransaction.requiringNew()
                                        .call(() -> commentRepository.save(new Comment(aula, student, "Moderate me")));

        given().header(studentAuth)
               .when()
               .post("/api/comments/{id}/hide", comment.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(outsiderAuth)
               .when()
               .post("/api/comments/{id}/hide", comment.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(teacherAuth)
               .when()
               .post("/api/comments/{id}/hide", comment.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("id", equalTo(comment.getId().intValue()))
               .body("hidden", equalTo(true));

        assertThat(commentRepository.findById(comment.getId()).orElseThrow().getHiddenAt()).isNotNull();

        given().header(studentAuth)
               .when()
               .post("/api/comments/{id}/restore", comment.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(teacherAuth)
               .when()
               .post("/api/comments/{id}/restore", comment.getId())
               .then()
               .statusCode(HttpStatus.SC_OK)
               .body("id", equalTo(comment.getId().intValue()))
               .body("hidden", equalTo(false));

        assertThat(commentRepository.findById(comment.getId()).orElseThrow().getHiddenAt()).isNull();
    }

    @Test
    @DisplayName("shouldForbidListCreateAndUpvoteOnLockedAulaWhilePreservingStoredComments")
    void shouldForbidListCreateAndUpvoteOnLockedAulaWhilePreservingStoredComments() {
        var course = Given.course(teacher, "Locked Discussion Course", CourseStatus.PUBLISHED, null);
        var first = Given.markdownItem(course, "Intro", "# Intro");
        var second = Given.markdownItem(course, "Setup", "# Setup");
        Given.enrollment(course, student, EnrollmentStatus.ENROLLED);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":true}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), first.getId())
               .then()
               .statusCode(HttpStatus.SC_OK);

        int commentId = given().header(studentAuth)
                               .contentType(ContentType.JSON)
                               .body("{\"content\":\"Stored while unlocked\"}")
                               .when()
                               .post("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), second.getId())
                               .then()
                               .statusCode(HttpStatus.SC_OK)
                               .extract()
                               .path("id");

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"completed\":false}")
               .when()
               .put("/api/courses/{courseId}/items/{itemId}/progress", course.getId(), first.getId())
               .then()
               .statusCode(HttpStatus.SC_OK);

        given().header(studentAuth)
               .when()
               .get("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), second.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(studentAuth)
               .contentType(ContentType.JSON)
               .body("{\"content\":\"Should not create\"}")
               .when()
               .post("/api/courses/{courseId}/items/{itemId}/comments", course.getId(), second.getId())
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        given().header(studentAuth)
               .when()
               .post("/api/comments/{id}/upvote", commentId)
               .then()
               .statusCode(HttpStatus.SC_FORBIDDEN);

        var preserved = commentRepository.findById(commentId).orElseThrow();
        assertThat(preserved.getContent()).isEqualTo("Stored while unlocked");
        assertThat(commentRepository.listByCourseItem(second.getId())).hasSize(1);
    }

    @Test
    @DisplayName("shouldExposeDiscussionEndpointsWithRequestResponseNamingAndOneHttpMethodEach")
    void shouldExposeDiscussionEndpointsWithRequestResponseNamingAndOneHttpMethodEach() throws ClassNotFoundException {
        var createRequest = Class.forName("dev.vepo.cursos.discussion.CreateCommentRequest");
        var commentResponse = Class.forName("dev.vepo.cursos.discussion.CommentResponse");
        assertThat(createRequest.isRecord()).isTrue();
        assertThat(commentResponse.isRecord()).isTrue();
        assertThat(createRequest.getSimpleName()).endsWith("Request");
        assertThat(commentResponse.getSimpleName()).endsWith("Response");

        var endpointNames = java.util.List.of(
                                              "dev.vepo.cursos.discussion.list.ListCommentsEndpoint",
                                              "dev.vepo.cursos.discussion.create.CreateCommentEndpoint",
                                              "dev.vepo.cursos.discussion.upvote.UpvoteCommentEndpoint",
                                              "dev.vepo.cursos.discussion.hide.HideCommentEndpoint",
                                              "dev.vepo.cursos.discussion.restore.RestoreCommentEndpoint");
        for (var name : endpointNames) {
            Class.forName(name);
        }

        var classes = new ClassFileImporter().importPackages("dev.vepo.cursos.discussion");
        for (var name : endpointNames) {
            var endpoint = classes.get(name);
            var httpMethods = endpoint.getMethods()
                                      .stream()
                                      .filter(m -> m.isAnnotatedWith(GET.class) || m.isAnnotatedWith(POST.class))
                                      .count();
            assertThat(httpMethods).as(name).isEqualTo(1);
        }
    }
}
