package dev.vepo.cursos.course.image.list;

import java.util.List;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.image.CourseImageAssetResponse;
import dev.vepo.cursos.course.image.CourseImageAssetService;
import dev.vepo.cursos.course.image.ImageTicketService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/images")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseImages")
public class ListCourseImagesEndpoint {

    private final CourseImageAssetService courseImageAssetService;
    private final CourseService courseService;
    private final ImageTicketService imageTicketService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public ListCourseImagesEndpoint(CourseImageAssetService courseImageAssetService,
                                    CourseService courseService,
                                    ImageTicketService imageTicketService,
                                    CurrentPassportUser currentPassportUser) {
        this.courseImageAssetService = courseImageAssetService;
        this.courseService = courseService;
        this.imageTicketService = imageTicketService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Operation(operationId = "listCourseImages")
    public List<CourseImageAssetResponse> list(@PathParam("courseId") long courseId) {
        var user = currentPassportUser.require();
        var course = courseService.require(courseId);
        var coverId = course.getCoverImageAssetId();
        return courseImageAssetService.list(courseId, user)
                                      .stream()
                                      .map(asset -> CourseImageAssetResponse.load(asset,
                                                                                  coverId != null && coverId.equals(asset.getId()),
                                                                                  imageTicketService.issue(courseId, asset.getId()).url()))
                                      .toList();
    }
}
