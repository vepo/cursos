package dev.vepo.cursos.course.image;

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
public class ImageTicketService {

    private final MediaProperties mediaProperties;

    @Inject
    public ImageTicketService(MediaProperties mediaProperties) {
        this.mediaProperties = mediaProperties;
    }

    public ImageTicket issue(long courseId, long assetId) {
        var expiresAt = Instant.now().getEpochSecond() + mediaProperties.playbackTicketTtlSeconds();
        var signature = sign(courseId, assetId, expiresAt);
        var path = "/api/media/images/%d/%d?expires=%d&sig=%s".formatted(courseId, assetId, expiresAt, signature);
        return new ImageTicket(path, expiresAt);
    }

    public void verify(long courseId, long assetId, long expiresAt, String signature) {
        if (signature == null || signature.isBlank()) {
            throw CursosException.forbidden("Invalid image ticket");
        }
        if (Instant.now().getEpochSecond() > expiresAt) {
            throw CursosException.forbidden("Image ticket expired");
        }
        var expected = sign(courseId, assetId, expiresAt);
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8))) {
            throw CursosException.forbidden("Invalid image ticket");
        }
    }

    private String sign(long courseId, long assetId, long expiresAt) {
        var payload = "image:%d:%d:%d".formatted(courseId, assetId, expiresAt);
        try {
            var mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(mediaProperties.signingSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new IllegalStateException("Unable to sign image ticket", ex);
        }
    }

    public record ImageTicket(String url, long expiresAt) {}
}
