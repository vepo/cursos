package dev.vepo.cursos.course.item.block;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.AulaBlockResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.UpdateLinkBlockRequest;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/items/{itemId}/blocks/{blockId}/link")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "AulaBlocks")
public class UpdateLinkBlockEndpoint {

    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UpdateLinkBlockEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @PUT
    @Authenticated
    @Operation(operationId = "updateLinkBlock")
    public AulaBlockResponse update(@PathParam("courseId") long courseId,
                                    @PathParam("itemId") long itemId,
                                    @PathParam("blockId") long blockId,
                                    @Valid UpdateLinkBlockRequest request) {
        return AulaBlockResponse.load(courseService.updateLinkBlock(courseId,
                                                                    itemId,
                                                                    blockId,
                                                                    request.linkUrl(),
                                                                    request.linkDescription(),
                                                                    currentPassportUser.require()));
    }
}
