package dev.vepo.cursos.course.item.block;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/courses/{courseId}/items/{itemId}/blocks/{blockId}")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "AulaBlocks")
public class DeleteAulaBlockEndpoint {

    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public DeleteAulaBlockEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @DELETE
    @Authenticated
    @Operation(operationId = "deleteAulaBlock")
    public Response delete(@PathParam("courseId") long courseId,
                           @PathParam("itemId") long itemId,
                           @PathParam("blockId") long blockId) {
        courseService.deleteBlock(courseId, itemId, blockId, currentPassportUser.require());
        return Response.noContent().build();
    }
}
