package dev.vepo.cursos.course.find;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseItemResponse;
import dev.vepo.cursos.course.CourseResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.enrollment.EnrollmentRepository;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.AuthorProfileService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import dev.vepo.cursos.infra.CursosException;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Courses")
public class FindCourseEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;
    private final EnrollmentRepository enrollmentRepository;
    private final AuthorProfileService authorProfileService;

    @Inject
    public FindCourseEndpoint(CourseService courseService,
                              CurrentPassportUser currentPassportUser,
                              EnrollmentRepository enrollmentRepository,
                              AuthorProfileService authorProfileService) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
        this.enrollmentRepository = enrollmentRepository;
        this.authorProfileService = authorProfileService;
    }

    @GET
    @Authenticated
    @Operation(operationId = "findCourse")
    public CourseDetailResponse find(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorization,
                                     @PathParam("courseId") long courseId) {
        var user = currentPassportUser.require();
        var course = courseService.require(courseId);
        boolean teacher = course.isTaughtBy(user.id());
        boolean enrolled = enrollmentRepository.findByCourseAndStudent(courseId, user.id())
                                               .map(e -> e.getStatus() == EnrollmentStatus.ENROLLED)
                                               .orElse(false);
        if (!teacher && course.getStatus() != CourseStatus.PUBLISHED && !enrolled) {
            throw CursosException.forbidden("Course is not available");
        }
        var author = authorProfileService.resolve(authorization,
                                                  course.getTeacherPassportUserId(),
                                                  course.getTeacherUsername(),
                                                  course.getTeacherName());
        var items = courseService.listItems(courseId).stream().map(CourseItemResponse::load).toList();
        return new CourseDetailResponse(CourseResponse.load(course, author), items, teacher, enrolled);
    }

    public record CourseDetailResponse(CourseResponse course, List<CourseItemResponse> items, boolean teaching, boolean enrolled) {}
}
