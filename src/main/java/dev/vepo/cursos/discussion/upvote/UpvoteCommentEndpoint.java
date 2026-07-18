package dev.vepo.cursos.discussion.upvote;

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

@Path("/comments/{commentId}/upvote")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Discussion")
public class UpvoteCommentEndpoint {

    private final CommentService commentService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UpvoteCommentEndpoint(CommentService commentService, CurrentPassportUser currentPassportUser) {
        this.commentService = commentService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "upvoteComment")
    public CommentResponse upvote(@PathParam("commentId") long commentId) {
        return commentService.toggleCommentUpvote(commentId, currentPassportUser.require());
    }
}
