package dev.vepo.cursos.course.publish;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/publish")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Courses")
public class PublishCourseEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public PublishCourseEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "publishCourse")
    public CourseResponse publish(@PathParam("courseId") long courseId) {
        return CourseResponse.load(courseService.publish(courseId, currentPassportUser.require()));
    }
}
