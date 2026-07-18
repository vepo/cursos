package dev.vepo.cursos.enrollment.approve;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.enrollment.EnrollmentResponse;
import dev.vepo.cursos.enrollment.EnrollmentService;
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

@Path("/enrollments/{enrollmentId}/approve")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Enrollments")
public class ApproveEnrollmentEndpoint {
    private final EnrollmentService enrollmentService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ApproveEnrollmentEndpoint(EnrollmentService enrollmentService, CurrentPassportUser currentPassportUser) {
        this.enrollmentService = enrollmentService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "approveEnrollment")
    public EnrollmentResponse approve(@PathParam("enrollmentId") long enrollmentId) {
        return EnrollmentResponse.load(enrollmentService.approve(enrollmentId, currentPassportUser.require()));
    }
}
