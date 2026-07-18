package dev.vepo.cursos.discussion.create;

import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.discussion.CommentResponse;
import dev.vepo.cursos.discussion.CommentService;
import dev.vepo.cursos.discussion.CreateCommentRequest;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;

@Path("/courses/{courseId}/items/{itemId}/comments")
@ApplicationScoped
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Discussion")
public class CreateCommentEndpoint {

    private final CommentService commentService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public CreateCommentEndpoint(CommentService commentService, CurrentPassportUser currentPassportUser) {
        this.commentService = commentService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "createComment")
    public CommentResponse create(@PathParam("courseId") long courseId,
                                  @PathParam("itemId") long itemId,
                                  CreateCommentRequest request) {
        return commentService.createComment(courseId, itemId, request, currentPassportUser.require());
    }
}
