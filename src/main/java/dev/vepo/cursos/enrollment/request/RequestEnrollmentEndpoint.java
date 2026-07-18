package dev.vepo.cursos.enrollment.request;

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

@Path("/courses/{courseId}/enrollments/request")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Enrollments")
public class RequestEnrollmentEndpoint {
    private final EnrollmentService enrollmentService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public RequestEnrollmentEndpoint(EnrollmentService enrollmentService, CurrentPassportUser currentPassportUser) {
        this.enrollmentService = enrollmentService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "requestEnrollment")
    public EnrollmentResponse request(@PathParam("courseId") long courseId) {
        return EnrollmentResponse.load(enrollmentService.requestEnrollment(courseId, currentPassportUser.require()));
    }
}
