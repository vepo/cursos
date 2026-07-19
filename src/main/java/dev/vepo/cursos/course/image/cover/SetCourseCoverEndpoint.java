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
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/cover/{assetId}")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseImages")
public class SetCourseCoverEndpoint {

    private final CourseImageAssetService courseImageAssetService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public SetCourseCoverEndpoint(CourseImageAssetService courseImageAssetService, CurrentPassportUser currentPassportUser) {
        this.courseImageAssetService = courseImageAssetService;
        this.currentPassportUser = currentPassportUser;
    }

    @PUT
    @Authenticated
    @Operation(operationId = "setCourseCover")
    public CourseResponse set(@PathParam("courseId") long courseId, @PathParam("assetId") long assetId) {
        var course = courseImageAssetService.setCover(courseId, assetId, currentPassportUser.require());
        return CourseResponse.load(course, null, courseImageAssetService.signedUrlOrNull(course));
    }
}
