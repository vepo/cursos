package dev.vepo.cursos.discussion.hide;

import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.discussion.CommentResponse;
import dev.vepo.cursos.discussion.CommentService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;

@Path("/comments/{commentId}/hide")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Discussion")
public class HideCommentEndpoint {

    private final CommentService commentService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public HideCommentEndpoint(CommentService commentService, CurrentPassportUser currentPassportUser) {
        this.commentService = commentService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "hideComment")
    public CommentResponse hide(@PathParam("commentId") long commentId) {
        return commentService.hideComment(commentId, currentPassportUser.require());
    }
}
