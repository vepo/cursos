package dev.vepo.cursos.course;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class MediaProperties {

    private final long maxImageBytes;
    private final long maxVideoBytes;
    private final String signingSecret;
    private final long playbackTicketTtlSeconds;
    private final int rangeChunkBytes;

    @Inject
    public MediaProperties(
                           @ConfigProperty(name = "cursos.media.max-image-bytes", defaultValue = "12582912") long maxImageBytes,
                           @ConfigProperty(name = "cursos.media.max-video-bytes", defaultValue = "262144000") long maxVideoBytes,
                           @ConfigProperty(name = "cursos.media.signing-secret", defaultValue = "cursos-dev-media-signing-secret") String signingSecret,
                           @ConfigProperty(name = "cursos.media.playback-ticket-ttl-seconds", defaultValue = "300") long playbackTicketTtlSeconds,
                           @ConfigProperty(name = "cursos.media.range-chunk-bytes", defaultValue = "1048576") int rangeChunkBytes) {
        this.maxImageBytes = maxImageBytes;
        this.maxVideoBytes = maxVideoBytes;
        this.signingSecret = signingSecret;
        this.playbackTicketTtlSeconds = playbackTicketTtlSeconds;
        this.rangeChunkBytes = rangeChunkBytes;
    }

    public long maxImageBytes() {
        return maxImageBytes;
    }

    public long maxVideoBytes() {
        return maxVideoBytes;
    }

    public String signingSecret() {
        return signingSecret;
    }

    public long playbackTicketTtlSeconds() {
        return playbackTicketTtlSeconds;
    }

    public int rangeChunkBytes() {
        return rangeChunkBytes;
    }
}
