package dev.vepo.cursos.course.item.update;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseItemResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.UpdateCourseItemTitleRequest;
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

@Path("/courses/{courseId}/items/{itemId}")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseItems")
public class UpdateCourseItemTitleEndpoint {

    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public UpdateCourseItemTitleEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @PUT
    @Authenticated
    @Operation(operationId = "updateCourseItemTitle")
    public CourseItemResponse update(@PathParam("courseId") long courseId,
                                     @PathParam("itemId") long itemId,
                                     @Valid UpdateCourseItemTitleRequest request) {
        return courseService.toItemResponse(courseService.updateItemTitle(courseId,
                                                                          itemId,
                                                                          request.title(),
                                                                          currentPassportUser.require()));
    }
}
