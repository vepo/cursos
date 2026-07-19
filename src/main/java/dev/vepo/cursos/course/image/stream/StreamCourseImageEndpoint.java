package dev.vepo.cursos.course.image.stream;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.image.CourseImageAssetService;
import jakarta.annotation.security.DenyAll;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

@Path("/media/images/{courseId}/{assetId}")
@ApplicationScoped
@DenyAll
@Tag(name = "CourseImages")
public class StreamCourseImageEndpoint {

    private final CourseImageAssetService courseImageAssetService;

    @Inject
    public StreamCourseImageEndpoint(CourseImageAssetService courseImageAssetService) {
        this.courseImageAssetService = courseImageAssetService;
    }

    @GET
    @PermitAll
    @Operation(operationId = "streamCourseImage")
    public Response stream(@PathParam("courseId") long courseId,
                           @PathParam("assetId") long assetId,
                           @QueryParam("expires") long expires,
                           @QueryParam("sig") String sig) {
        courseImageAssetService.verifyAndLoad(courseId, assetId, expires, sig);
        var asset = courseImageAssetService.requireAsset(courseId, assetId);
        return Response.ok(asset.getContent())
                       .type(asset.getContentType())
                       .header(HttpHeaders.CONTENT_LENGTH, asset.getSizeBytes())
                       .header("Cache-Control", "private, max-age=60")
                       .header("Content-Disposition", "inline; filename=\"%s\"".formatted(asset.getFilename()))
                       .build();
    }
}
