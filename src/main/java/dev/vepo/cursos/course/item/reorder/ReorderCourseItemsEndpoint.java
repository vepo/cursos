package dev.vepo.cursos.course.item.reorder;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseItemResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.ReorderCourseItemsRequest;
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

@Path("/courses/{courseId}/items/reorder")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseItems")
public class ReorderCourseItemsEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ReorderCourseItemsEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "reorderCourseItems")
    public List<CourseItemResponse> reorder(@PathParam("courseId") long courseId, @Valid ReorderCourseItemsRequest request) {
        return courseService.reorder(courseId, request.itemIds(), currentPassportUser.require()).stream().map(CourseItemResponse::load).toList();
    }
}
