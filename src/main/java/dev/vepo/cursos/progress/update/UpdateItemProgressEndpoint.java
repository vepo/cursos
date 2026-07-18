package dev.vepo.cursos.progress.update;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.identity.CurrentPassportUser;
import dev.vepo.cursos.progress.ItemProgressResponse;
import dev.vepo.cursos.progress.ProgressService;
import dev.vepo.cursos.progress.UpdateProgressRequest;
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

@Path("/courses/{courseId}/items/{itemId}/progress")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Progress")
public class UpdateItemProgressEndpoint {
    private final ProgressService progressService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UpdateItemProgressEndpoint(ProgressService progressService, CurrentPassportUser currentPassportUser) {
        this.progressService = progressService;
        this.currentPassportUser = currentPassportUser;
    }

    @PUT
    @Authenticated
    @Operation(operationId = "updateItemProgress")
    public ItemProgressResponse update(@PathParam("courseId") long courseId, @PathParam("itemId") long itemId, @Valid UpdateProgressRequest request) {
        return ItemProgressResponse.load(progressService.updateItemProgress(courseId, itemId, request, currentPassportUser.require()));
    }
}
