package dev.vepo.cursos.course.image.ticket;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.image.CourseImageAssetService;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/courses/{courseId}/images/tickets")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "CourseImages")
public class CreateImageTicketsEndpoint {

    private final CourseImageAssetService courseImageAssetService;
    private final CurrentPassportUser currentPassportUser;

    @Inject
    public CreateImageTicketsEndpoint(CourseImageAssetService courseImageAssetService, CurrentPassportUser currentPassportUser) {
        this.courseImageAssetService = courseImageAssetService;
        this.currentPassportUser = currentPassportUser;
    }

    @POST
    @Authenticated
    @Operation(operationId = "createImageTickets")
    public CreateImageTicketsResponse create(@PathParam("courseId") long courseId, CreateImageTicketsRequest request) {
        var tickets = courseImageAssetService.issueTickets(courseId, request.assetIds(), currentPassportUser.require());
        return new CreateImageTicketsResponse(tickets.stream()
                                                     .map(ticket -> new ImageTicketResponse(extractAssetId(ticket.url()), ticket.url(), ticket.expiresAt()))
                                                     .toList());
    }

    private static long extractAssetId(String url) {
        var path = url.split("\\?", 2)[0];
        var parts = path.split("/");
        return Long.parseLong(parts[parts.length - 1]);
    }
}
