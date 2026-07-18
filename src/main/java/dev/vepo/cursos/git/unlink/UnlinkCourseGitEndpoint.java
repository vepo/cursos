package dev.vepo.cursos.git.unlink;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.git.GitCourseSyncService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

@Path("/courses/{courseId}/git")
@ApplicationScoped
@DenyAll
@Tag(name = "Git")
public class UnlinkCourseGitEndpoint {
    private final GitCourseSyncService gitCourseSyncService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UnlinkCourseGitEndpoint(GitCourseSyncService gitCourseSyncService, CurrentPassportUser currentPassportUser) {
        this.gitCourseSyncService = gitCourseSyncService;
        this.currentPassportUser = currentPassportUser;
    }

    @DELETE
    @Authenticated
    @Operation(operationId = "unlinkCourseGit")
    public Response unlink(@PathParam("courseId") long courseId) {
        gitCourseSyncService.unlink(courseId, currentPassportUser.require());
        return Response.noContent().build();
    }
}
