package dev.vepo.cursos.git.link;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.git.CourseGitStatusResponse;
import dev.vepo.cursos.git.GitCourseSyncService;
import dev.vepo.cursos.git.LinkCourseGitRequest;
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

@Path("/courses/{courseId}/git")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Git")
public class LinkCourseGitEndpoint {
    private final GitCourseSyncService gitCourseSyncService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public LinkCourseGitEndpoint(GitCourseSyncService gitCourseSyncService, CurrentPassportUser currentPassportUser) {
        this.gitCourseSyncService = gitCourseSyncService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "linkCourseGit")
    public CourseGitStatusResponse link(@PathParam("courseId") long courseId, @Valid LinkCourseGitRequest request) {
        return CourseGitStatusResponse.load(gitCourseSyncService.link(courseId, request, currentPassportUser.require()));
    }
}
