package dev.vepo.cursos.progress.get;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.identity.CurrentPassportUser;
import dev.vepo.cursos.progress.ProgressService;
import dev.vepo.cursos.progress.ProgressSummaryResponse;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/progress")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Progress")
public class ListCourseProgressEndpoint {
    private final ProgressService progressService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ListCourseProgressEndpoint(ProgressService progressService, CurrentPassportUser currentPassportUser) {
        this.progressService = progressService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Operation(operationId = "listCourseProgress")
    public List<ProgressSummaryResponse> list(@PathParam("courseId") long courseId) {
        return progressService.summariesForCourse(courseId, currentPassportUser.require());
    }
}
