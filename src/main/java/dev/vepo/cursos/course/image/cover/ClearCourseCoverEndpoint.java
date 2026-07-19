package dev.vepo.cursos.course.image.cover;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseResponse;
import dev.vepo.cursos.course.image.CourseImageAssetService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/cover")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseImages")
public class ClearCourseCoverEndpoint {

    private final CourseImageAssetService courseImageAssetService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ClearCourseCoverEndpoint(CourseImageAssetService courseImageAssetService, CurrentPassportUser currentPassportUser) {
        this.courseImageAssetService = courseImageAssetService;
        this.currentPassportUser = currentPassportUser;
    }

    @DELETE
    @Authenticated
    @Operation(operationId = "clearCourseCover")
    public CourseResponse clear(@PathParam("courseId") long courseId) {
        var course = courseImageAssetService.clearCover(courseId, currentPassportUser.require());
        return CourseResponse.load(course, null, null);
    }
}
