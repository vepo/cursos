package dev.vepo.cursos.course.item.upload;

import java.io.IOException;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import dev.vepo.cursos.course.AulaBlockType;
import dev.vepo.cursos.course.CourseItemResponse;
import dev.vepo.cursos.course.CourseService;
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

@Path("/courses/{courseId}/items/media")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.MULTIPART_FORM_DATA)
@DenyAll
@Tag(name = "CourseItems")
public class UploadMediaItemEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UploadMediaItemEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "uploadMediaItem")
    public CourseItemResponse upload(@PathParam("courseId") long courseId,
                                     @RestForm("title") @Schema(required = true) String title,
                                     @RestForm("type") @Schema(required = true) String type,
                                     @RestForm("file") @Schema(required = true, type = org.eclipse.microprofile.openapi.annotations.enums.SchemaType.STRING, format = "binary") FileUpload file) {
        if (file == null) {
            throw CursosException.badRequest("Media file is required");
        }
        try {
            var itemType = AulaBlockType.valueOf(type.toUpperCase());
            var bytes = java.nio.file.Files.readAllBytes(file.uploadedFile());
            var contentType = file.contentType() != null ? file.contentType() : "application/octet-stream";
            return courseService.toItemResponse(courseService.addMediaItem(courseId, title, itemType, contentType, file.fileName(), bytes,
                                                                           currentPassportUser.require()));
        } catch (IllegalArgumentException ex) {
            throw CursosException.badRequest("type must be IMAGE or VIDEO");
        } catch (IOException ex) {
            throw CursosException.badRequest("Failed to read uploaded file");
        }
    }
}
