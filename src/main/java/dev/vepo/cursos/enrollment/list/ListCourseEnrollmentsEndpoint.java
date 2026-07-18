package dev.vepo.cursos.enrollment.list;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.enrollment.EnrollmentResponse;
import dev.vepo.cursos.enrollment.EnrollmentService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/enrollments")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Enrollments")
public class ListCourseEnrollmentsEndpoint {
    private final EnrollmentService enrollmentService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ListCourseEnrollmentsEndpoint(EnrollmentService enrollmentService, CurrentPassportUser currentPassportUser) {
        this.enrollmentService = enrollmentService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Operation(operationId = "listCourseEnrollments")
    public List<EnrollmentResponse> list(@PathParam("courseId") long courseId) {
        return enrollmentService.listForCourse(courseId, currentPassportUser.require()).stream().map(EnrollmentResponse::load).toList();
    }
}
