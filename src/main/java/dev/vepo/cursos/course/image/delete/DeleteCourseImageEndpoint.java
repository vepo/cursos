package dev.vepo.cursos.course.image.delete;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

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
import jakarta.ws.rs.core.Response;

@Path("/courses/{courseId}/images/{assetId}")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseImages")
public class DeleteCourseImageEndpoint {

    private final CourseImageAssetService courseImageAssetService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public DeleteCourseImageEndpoint(CourseImageAssetService courseImageAssetService, CurrentPassportUser currentPassportUser) {
        this.courseImageAssetService = courseImageAssetService;
        this.currentPassportUser = currentPassportUser;
    }

    @DELETE
    @Authenticated
    @Operation(operationId = "deleteCourseImage")
    public Response delete(@PathParam("courseId") long courseId, @PathParam("assetId") long assetId) {
        courseImageAssetService.delete(courseId, assetId, currentPassportUser.require());
        return Response.noContent().build();
    }
}
