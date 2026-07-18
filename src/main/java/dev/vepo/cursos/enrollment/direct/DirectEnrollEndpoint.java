package dev.vepo.cursos.enrollment.direct;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.enrollment.DirectEnrollRequest;
import dev.vepo.cursos.enrollment.EnrollmentResponse;
import dev.vepo.cursos.enrollment.EnrollmentService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/enrollments")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Enrollments")
public class DirectEnrollEndpoint {
    private final EnrollmentService enrollmentService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public DirectEnrollEndpoint(EnrollmentService enrollmentService, CurrentPassportUser currentPassportUser) {
        this.enrollmentService = enrollmentService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "directEnroll")
    public EnrollmentResponse enroll(@PathParam("courseId") long courseId, @Valid DirectEnrollRequest request) {
        return EnrollmentResponse.load(enrollmentService.directEnroll(courseId, request, currentPassportUser.require()));
    }
}
