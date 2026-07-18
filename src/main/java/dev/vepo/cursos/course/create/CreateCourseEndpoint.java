package dev.vepo.cursos.course.create;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.CreateCourseRequest;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Courses")
public class CreateCourseEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public CreateCourseEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "createCourse")
    public CourseResponse create(@Valid CreateCourseRequest request) {
        return CourseResponse.load(courseService.create(request, currentPassportUser.require()));
    }
}
