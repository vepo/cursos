package dev.vepo.cursos.discussion.list;

import java.util.List;

import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
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

@Path("/courses/{courseId}/items/{itemId}/comments")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Discussion")
public class ListCommentsEndpoint {

    private final CommentService commentService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ListCommentsEndpoint(CommentService commentService, CurrentPassportUser currentPassportUser) {
        this.commentService = commentService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Operation(operationId = "listComments")
    public List<CommentResponse> list(@PathParam("courseId") long courseId, @PathParam("itemId") long itemId) {
        return commentService.listAccessibleComments(courseId, itemId, currentPassportUser.require());
    }
}
