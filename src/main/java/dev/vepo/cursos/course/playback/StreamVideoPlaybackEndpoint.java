package dev.vepo.cursos.course.playback;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.course.CourseResourceRepository;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.MediaProperties;
import dev.vepo.cursos.infra.CursosException;
import jakarta.annotation.security.DenyAll;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;

@Path("/media/playback/{courseId}/{itemId}/{resourceId}")
@ApplicationScoped
@DenyAll
@Tag(name = "CourseItems")
public class StreamVideoPlaybackEndpoint {

    private final PlaybackTicketService playbackTicketService;
    private final CourseService courseService;
    private final CourseResourceRepository courseResourceRepository;
    private final MediaProperties mediaProperties;

    @Inject
    public StreamVideoPlaybackEndpoint(PlaybackTicketService playbackTicketService,
                                       CourseService courseService,
                                       CourseResourceRepository courseResourceRepository,
                                       MediaProperties mediaProperties) {
        this.playbackTicketService = playbackTicketService;
        this.courseService = courseService;
        this.courseResourceRepository = courseResourceRepository;
        this.mediaProperties = mediaProperties;
    }

    @GET
    @PermitAll
    @Operation(operationId = "streamVideoPlayback")
    public Response stream(@PathParam("courseId") long courseId,
                           @PathParam("itemId") long itemId,
                           @PathParam("resourceId") long resourceId,
                           @QueryParam("expires") long expires,
                           @QueryParam("sig") String sig,
                           @HeaderParam("Range") String rangeHeader) {
        playbackTicketService.verify(courseId, itemId, resourceId, expires, sig);
        courseService.requireVideoItem(courseId, itemId, resourceId);
        var meta = courseResourceRepository.findById(resourceId)
                                           .orElseThrow(() -> CursosException.notFound("Course resource not found: %d".formatted(resourceId)));
        long size = meta.getSizeBytes();
        long start = 0;
        long end = size - 1;
        boolean partial = false;
        if (rangeHeader != null && !rangeHeader.isBlank()) {
            var parsed = parseRange(rangeHeader, size);
            if (parsed == null) {
                return Response.status(Response.Status.REQUESTED_RANGE_NOT_SATISFIABLE)
                               .header("Content-Range", "bytes */%d".formatted(size))
                               .header("Accept-Ranges", "bytes")
                               .build();
            }
            start = parsed[0];
            end = parsed[1];
            partial = true;
        } else {
            end = Math.min(end, start + mediaProperties.rangeChunkBytes() - 1L);
            partial = end < size - 1;
        }
        var slice = courseResourceRepository.readSlice(resourceId, start, end)
                                            .orElseThrow(() -> CursosException.notFound("Course resource not found: %d".formatted(resourceId)));
        if (slice.unsatisfiable()) {
            return Response.status(Response.Status.REQUESTED_RANGE_NOT_SATISFIABLE)
                           .header("Content-Range", "bytes */%d".formatted(size))
                           .header("Accept-Ranges", "bytes")
                           .build();
        }
        var builder = Response.status(partial ? 206 : 200)
                              .entity(slice.content())
                              .type(slice.contentType())
                              .header("Accept-Ranges", "bytes")
                              .header(HttpHeaders.CONTENT_LENGTH, slice.content().length)
                              .header("Content-Disposition", "inline; filename=\"%s\"".formatted(slice.filename()));
        if (partial) {
            builder.header("Content-Range", "bytes %d-%d/%d".formatted(slice.startInclusive(), slice.endInclusive(), size));
        }
        return builder.build();
    }

    private static long[] parseRange(String rangeHeader, long size) {
        if (!rangeHeader.startsWith("bytes=") || size <= 0) {
            return null;
        }
        var spec = rangeHeader.substring("bytes=".length()).trim();
        if (spec.contains(",")) {
            return null;
        }
        var parts = spec.split("-", 2);
        try {
            if (parts[0].isEmpty()) {
                var suffix = Long.parseLong(parts[1]);
                if (suffix <= 0) {
                    return null;
                }
                var start = Math.max(size - suffix, 0);
                return new long[] { start, size - 1 };
            }
            var start = Long.parseLong(parts[0]);
            var end = parts[1].isEmpty() ? size - 1 : Long.parseLong(parts[1]);
            if (start < 0 || start >= size || end < start) {
                return null;
            }
            return new long[] { start, Math.min(end, size - 1) };
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
