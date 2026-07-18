package dev.vepo.cursos.course.update;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.UpdateCourseRequest;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Courses")
public class UpdateCourseEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UpdateCourseEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @PUT
    @Authenticated
    @Operation(operationId = "updateCourse")
    public CourseResponse update(@PathParam("courseId") long courseId, @Valid UpdateCourseRequest request) {
        return CourseResponse.load(courseService.update(courseId, request, currentPassportUser.require()));
    }
}
