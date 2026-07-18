package dev.vepo.cursos.study.tree;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.identity.CurrentPassportUser;
import dev.vepo.cursos.study.StudyResponse;
import dev.vepo.cursos.study.StudyService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/study")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Study")
public class GetCourseStudyEndpoint {
    private final StudyService studyService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public GetCourseStudyEndpoint(StudyService studyService, CurrentPassportUser currentPassportUser) {
        this.studyService = studyService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Operation(operationId = "getCourseStudy")
    public StudyResponse get(@PathParam("courseId") long courseId) {
        return studyService.studyTree(courseId, currentPassportUser.require());
    }
}
