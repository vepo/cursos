package dev.vepo.cursos.course.playback;

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
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/items/{itemId}/playback-ticket")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseItems")
public class CreatePlaybackTicketEndpoint {

    private final CourseService courseService;
    private final CurrentPassportUser currentPassportUser;
    private final EnrollmentRepository enrollmentRepository;
    private final PlaybackTicketService playbackTicketService;

    @Inject
    public CreatePlaybackTicketEndpoint(CourseService courseService,
                                        CurrentPassportUser currentPassportUser,
                                        EnrollmentRepository enrollmentRepository,
                                        PlaybackTicketService playbackTicketService) {
        this.courseService = courseService;
        this.currentPassportUser = currentPassportUser;
        this.enrollmentRepository = enrollmentRepository;
        this.playbackTicketService = playbackTicketService;
    }

    @POST
    @Authenticated
    @Operation(operationId = "createPlaybackTicket")
    public PlaybackTicketResponse create(@PathParam("courseId") long courseId, @PathParam("itemId") long itemId) {
        var user = currentPassportUser.require();
        var course = courseService.require(courseId);
        boolean teacher = course.isTaughtBy(user.id());
        boolean enrolled = enrollmentRepository.findByCourseAndStudent(courseId, user.id())
                                               .map(e -> e.getStatus() == EnrollmentStatus.ENROLLED)
                                               .orElse(false);
        if (!teacher && !enrolled) {
            throw CursosException.forbidden("Not allowed to play this video");
        }
        if (!teacher && course.getStatus() != CourseStatus.PUBLISHED) {
            throw CursosException.forbidden("Course is not available");
        }
        var item = courseService.requireItemOfCourse(courseId, itemId);
        if (item.getResource() == null) {
            throw CursosException.badRequest("Video resource is missing");
        }
        courseService.requireVideoItem(courseId, itemId, item.getResource().getId());
        var ticket = playbackTicketService.issue(courseId, itemId, item.getResource().getId());
        return new PlaybackTicketResponse(ticket.url(), ticket.expiresAt());
    }

    public record PlaybackTicketResponse(String url, long expiresAt) {}
}
