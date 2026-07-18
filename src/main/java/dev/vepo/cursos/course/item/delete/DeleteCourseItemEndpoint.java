package dev.vepo.cursos.course.item.delete;

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
import jakarta.ws.rs.core.Response;

@Path("/courses/{courseId}/items/{itemId}")
@ApplicationScoped
@DenyAll
@Tag(name = "CourseItems")
public class DeleteCourseItemEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public DeleteCourseItemEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @DELETE
    @Authenticated
    @Operation(operationId = "deleteCourseItem")
    public Response delete(@PathParam("courseId") long courseId, @PathParam("itemId") long itemId) {
        courseService.deleteItem(itemId, currentPassportUser.require());
        return Response.noContent().build();
    }
}
