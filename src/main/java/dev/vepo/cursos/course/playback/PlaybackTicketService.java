package dev.vepo.cursos.course.playback;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import dev.vepo.cursos.course.MediaProperties;
import dev.vepo.cursos.infra.CursosException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class PlaybackTicketService {

    private final MediaProperties mediaProperties;

    @Inject
    public PlaybackTicketService(MediaProperties mediaProperties) {
        this.mediaProperties = mediaProperties;
    }

    public PlaybackTicket issue(long courseId, long itemId, long resourceId) {
        var expiresAt = Instant.now().getEpochSecond() + mediaProperties.playbackTicketTtlSeconds();
        var signature = sign(courseId, itemId, resourceId, expiresAt);
        var path = "/api/media/playback/%d/%d/%d?expires=%d&sig=%s".formatted(courseId, itemId, resourceId, expiresAt, signature);
        return new PlaybackTicket(path, expiresAt);
    }

    public void verify(long courseId, long itemId, long resourceId, long expiresAt, String signature) {
        if (signature == null || signature.isBlank()) {
            throw CursosException.forbidden("Invalid playback ticket");
        }
        if (Instant.now().getEpochSecond() > expiresAt) {
            throw CursosException.forbidden("Playback ticket expired");
        }
        var expected = sign(courseId, itemId, resourceId, expiresAt);
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8))) {
            throw CursosException.forbidden("Invalid playback ticket");
        }
    }

    private String sign(long courseId, long itemId, long resourceId, long expiresAt) {
        var payload = "%d:%d:%d:%d".formatted(courseId, itemId, resourceId, expiresAt);
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(mediaProperties.signingSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("Unable to sign playback ticket", ex);
        }
    }

    public record PlaybackTicket(String url, long expiresAt) {}
}
