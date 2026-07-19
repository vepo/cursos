package dev.vepo.cursos.progress.certificate;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

@Path("/courses/{courseId}/certificate")
@ApplicationScoped
@DenyAll
@Tag(name = "Progress")
public class DownloadCertificateEndpoint {

    private final CertificateService certificateService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public DownloadCertificateEndpoint(CertificateService certificateService, CurrentPassportUser currentPassportUser) {
        this.certificateService = certificateService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Produces("application/pdf")
    @Operation(operationId = "downloadCourseCertificate")
    @APIResponse(responseCode = "200", description = "Course completion certificate PDF", content = @Content(mediaType = "application/pdf", schema = @Schema(type = SchemaType.STRING, format = "binary")))
    public Response download(@PathParam("courseId") long courseId) {
        var pdf = certificateService.issueForCourse(courseId, currentPassportUser.require());
        return Response.ok(pdf.content())
                       .type("application/pdf")
                       .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"%s\"".formatted(pdf.filename()))
                       .header(HttpHeaders.CONTENT_LENGTH, pdf.content().length)
                       .build();
    }
}
