package dev.vepo.cursos.course.item.block;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.AulaBlockResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.ReorderAulaBlocksRequest;
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

@Path("/courses/{courseId}/items/{itemId}/blocks/reorder")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "AulaBlocks")
public class ReorderAulaBlocksEndpoint {

    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ReorderAulaBlocksEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "reorderAulaBlocks")
    public List<AulaBlockResponse> reorder(@PathParam("courseId") long courseId,
                                           @PathParam("itemId") long itemId,
                                           @Valid ReorderAulaBlocksRequest request) {
        return courseService.reorderBlocks(courseId, itemId, request.blockIds(), currentPassportUser.require())
                            .stream()
                            .map(AulaBlockResponse::load)
                            .toList();
    }
}
