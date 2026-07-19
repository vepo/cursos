package dev.vepo.cursos.course.image;

import java.time.Instant;

public record CourseImageAssetResponse(
                                       long id,
                                       long courseId,
                                       String contentType,
                                       String filename,
                                       long sizeBytes,
                                       boolean cover,
                                       String signedUrl,
                                       Instant createdAt) {

    public static CourseImageAssetResponse load(CourseImageAsset asset, boolean cover, String signedUrl) {
        return new CourseImageAssetResponse(asset.getId(),
                                            asset.getCourse().getId(),
                                            asset.getContentType(),
                                            asset.getFilename(),
                                            asset.getSizeBytes(),
                                            cover,
                                            signedUrl,
                                            asset.getCreatedAt());
    }
}
