package dev.vepo.cursos.course.image.upload;

import java.io.IOException;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import dev.vepo.cursos.course.image.CourseImageAssetResponse;
import dev.vepo.cursos.course.image.CourseImageAssetService;
import dev.vepo.cursos.course.image.ImageTicketService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import dev.vepo.cursos.infra.CursosException;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/images")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.MULTIPART_FORM_DATA)
@DenyAll
@Tag(name = "CourseImages")
public class UploadCourseImageEndpoint {

    private final CourseImageAssetService courseImageAssetService;
    private final ImageTicketService imageTicketService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UploadCourseImageEndpoint(CourseImageAssetService courseImageAssetService,
                                     ImageTicketService imageTicketService,
                                     CurrentPassportUser currentPassportUser) {
        this.courseImageAssetService = courseImageAssetService;
        this.imageTicketService = imageTicketService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "uploadCourseImage")
    public CourseImageAssetResponse upload(@PathParam("courseId") long courseId,
                                           @RestForm("file") @Schema(required = true, type = org.eclipse.microprofile.openapi.annotations.enums.SchemaType.STRING, format = "binary") FileUpload file) {
        if (file == null) {
            throw CursosException.badRequest("Image file is required");
        }
        try {
            var bytes = java.nio.file.Files.readAllBytes(file.uploadedFile());
            var contentType = file.contentType() != null ? file.contentType() : "application/octet-stream";
            var asset = courseImageAssetService.upload(courseId, contentType, file.fileName(), bytes, currentPassportUser.require());
            var ticket = imageTicketService.issue(courseId, asset.getId());
            return CourseImageAssetResponse.load(asset, false, ticket.url());
        } catch (IOException ex) {
            throw CursosException.badRequest("Failed to read uploaded file");
        }
    }
}
