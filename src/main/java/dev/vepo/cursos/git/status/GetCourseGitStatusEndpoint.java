package dev.vepo.cursos.git.status;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.git.CourseGitStatusResponse;
import dev.vepo.cursos.git.GitCourseSyncService;
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

@Path("/courses/{courseId}/git")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Git")
public class GetCourseGitStatusEndpoint {
    private final GitCourseSyncService gitCourseSyncService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public GetCourseGitStatusEndpoint(GitCourseSyncService gitCourseSyncService, CurrentPassportUser currentPassportUser) {
        this.gitCourseSyncService = gitCourseSyncService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Operation(operationId = "getCourseGitStatus")
    public CourseGitStatusResponse status(@PathParam("courseId") long courseId) {
        return gitCourseSyncService.status(courseId, currentPassportUser.require());
    }
}
