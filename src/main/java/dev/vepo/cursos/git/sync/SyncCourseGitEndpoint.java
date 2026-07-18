package dev.vepo.cursos.git.sync;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.git.CourseGitStatusResponse;
import dev.vepo.cursos.git.GitCourseSyncService;
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

@Path("/courses/{courseId}/git/sync")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Git")
public class SyncCourseGitEndpoint {
    private final GitCourseSyncService gitCourseSyncService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public SyncCourseGitEndpoint(GitCourseSyncService gitCourseSyncService, CurrentPassportUser currentPassportUser) {
        this.gitCourseSyncService = gitCourseSyncService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "syncCourseGit")
    public CourseGitStatusResponse sync(@PathParam("courseId") long courseId) {
        return gitCourseSyncService.sync(courseId, currentPassportUser.require());
    }
}
