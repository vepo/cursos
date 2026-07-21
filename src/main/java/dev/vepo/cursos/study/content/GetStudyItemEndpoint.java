package dev.vepo.cursos.study.content;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseItemResponse;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import dev.vepo.cursos.study.StudyService;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/items/{itemId}")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Study")
public class GetStudyItemEndpoint {
    private final StudyService studyService;
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public GetStudyItemEndpoint(StudyService studyService,
                                CourseService courseService,
                                CurrentPassportUser currentPassportUser) {
        this.studyService = studyService;
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
    }

    @GET
    @Authenticated
    @Operation(operationId = "getStudyItem")
    public CourseItemResponse get(@PathParam("courseId") long courseId, @PathParam("itemId") long itemId) {
        return courseService.toItemResponse(studyService.requireAccessibleItem(courseId, itemId, currentPassportUser.require()));
    }
}
