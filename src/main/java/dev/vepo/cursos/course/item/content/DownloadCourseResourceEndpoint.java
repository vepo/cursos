package dev.vepo.cursos.course.item.content;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.enrollment.EnrollmentRepository;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.CurrentPassportUser;
import dev.vepo.cursos.infra.CursosException;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

@Path("/courses/{courseId}/resources/{resourceId}")
@ApplicationScoped
@DenyAll
@Tag(name = "CourseItems")
public class DownloadCourseResourceEndpoint {
    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;
    private final EnrollmentRepository enrollmentRepository;

    @Inject
    public DownloadCourseResourceEndpoint(CourseService courseService, CurrentPassportUser currentPassportUser, EnrollmentRepository enrollmentRepository) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
        this.enrollmentRepository = enrollmentRepository;
    }

    @GET
    @Authenticated
    @Operation(operationId = "downloadCourseResource")
    public Response download(@PathParam("courseId") long courseId, @PathParam("resourceId") long resourceId) {
        var user = currentPassportUser.require();
        var course = courseService.require(courseId);
        boolean teacher = course.isTaughtBy(user.id());
        boolean enrolled = enrollmentRepository.findByCourseAndStudent(courseId, user.id())
                                               .map(e -> e.getStatus() == EnrollmentStatus.ENROLLED)
                                               .orElse(false);
        if (!teacher && !enrolled && course.getStatus() != CourseStatus.PUBLISHED) {
            throw CursosException.forbidden("Not allowed to download resource");
        }
        var resource = courseService.requireResource(resourceId);
        return Response.ok(resource.getContent())
                       .type(resource.getContentType())
                       .header("Content-Disposition", "inline; filename=\"%s\"".formatted(resource.getFilename()))
                       .build();
    }
}
