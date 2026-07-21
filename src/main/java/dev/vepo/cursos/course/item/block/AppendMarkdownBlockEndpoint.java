package dev.vepo.cursos.course.item.block;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.AppendMarkdownBlockRequest;
import dev.vepo.cursos.course.AulaBlockResponse;
import dev.vepo.cursos.course.CourseService;
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

@Path("/courses/{courseId}/items/{itemId}/blocks/markdown")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "AulaBlocks")
public class AppendMarkdownBlockEndpoint {

    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public AppendMarkdownBlockEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "appendMarkdownBlock")
    public AulaBlockResponse append(@PathParam("courseId") long courseId,
                                    @PathParam("itemId") long itemId,
                                    @Valid AppendMarkdownBlockRequest request) {
        return AulaBlockResponse.load(courseService.appendMarkdownBlock(courseId,
                                                                        itemId,
                                                                        request.markdownBody(),
                                                                        currentPassportUser.require()));
    }
}
