package dev.vepo.cursos.course.item.update;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseItemResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.UpdateLinkItemRequest;
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

@Path("/courses/{courseId}/items/{itemId}/link")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseItems")
public class UpdateLinkItemEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UpdateLinkItemEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @PUT
    @Authenticated
    @Operation(operationId = "updateLinkItem")
    public CourseItemResponse update(@PathParam("courseId") long courseId,
                                     @PathParam("itemId") long itemId,
                                     @Valid UpdateLinkItemRequest request) {
        courseService.requireItemOfCourse(courseId, itemId);
        return CourseItemResponse.load(courseService.updateLinkItem(itemId,
                                                                    request.title(),
                                                                    request.linkUrl(),
                                                                    request.linkDescription(),
                                                                    currentPassportUser.require()));
    }
}
