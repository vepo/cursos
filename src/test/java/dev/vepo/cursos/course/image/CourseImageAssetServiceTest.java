package dev.vepo.cursos.course.image;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

@QuarkusTest
@DisplayName("Course image asset service")
class CourseImageAssetServiceTest {

    private static final byte[] TINY_PNG =
            new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, (byte) 0x90, 0x77, 0x53, (byte) 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, (byte) 0xD7, 0x63, (byte) 0xF8, (byte) 0xCF, (byte) 0xC0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, (byte) 0xFE, (byte) 0xD4, (byte) 0xEF, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE, 0x42, 0x60, (byte) 0x82
            };

    private static final byte[] TINY_JPEG =
            new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00 };

    @Inject
    CourseImageAssetService courseImageAssetService;

    @Inject
    CourseService courseService;

    private PassportUser teacher;
    private PassportUser stranger;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(130L, "img-svc-teacher");
        stranger = Given.user(131L, "img-svc-stranger");
    }

    @Test
    @DisplayName("shouldExtractReferencedAssetIdsFromMarkdown")
    void shouldExtractReferencedAssetIdsFromMarkdown() {
        assertTrue(courseImageAssetService.extractReferencedAssetIds(null).isEmpty());
        assertTrue(courseImageAssetService.extractReferencedAssetIds("   ").isEmpty());
        assertEquals(Set.of(12L, 34L),
                     courseImageAssetService.extractReferencedAssetIds("![a](course-asset:12) text ![b](course-asset:34)"));
    }

    @Test
    @DisplayName("shouldRejectInvalidImageUploadPayloads")
    void shouldRejectInvalidImageUploadPayloads() {
        var course = Given.course(teacher, "Images", CourseStatus.DRAFT, List.of());

        assertThrows(CursosException.class,
                     () -> courseImageAssetService.upload(course.getId(), "image/png", "x.png", null, teacher));
        assertThrows(CursosException.class,
                     () -> courseImageAssetService.upload(course.getId(), "image/png", "x.png", new byte[0], teacher));
        assertThrows(CursosException.class,
                     () -> courseImageAssetService.upload(course.getId(), "image/png", "x.png", new byte[] { 1, 2, 3 }, teacher));
        assertThrows(CursosException.class,
                     () -> courseImageAssetService.upload(course.getId(), "image/png", null, TINY_PNG, teacher));
        assertThrows(CursosException.class,
                     () -> courseImageAssetService.upload(course.getId(), "image/png", " ", TINY_PNG, teacher));
        assertThrows(CursosException.class,
                     () -> courseImageAssetService.upload(course.getId(),
                                                          "image/png",
                                                          "x".repeat(256),
                                                          TINY_PNG,
                                                          teacher));
        assertThrows(CursosException.class,
                     () -> courseImageAssetService.upload(course.getId(), "image/png", "bad.png", TINY_JPEG, teacher));
    }

    @Test
    @DisplayName("shouldNormalizeJpgMimeAndSanitizeFilenamePath")
    void shouldNormalizeJpgMimeAndSanitizeFilenamePath() {
        var course = Given.course(teacher, "Images", CourseStatus.DRAFT, List.of());
        var asset = courseImageAssetService.upload(course.getId(),
                                                   "image/jpg; charset=binary",
                                                   "../folder/photo.jpg",
                                                   TINY_JPEG,
                                                   teacher);
        assertEquals("image/jpeg", asset.getContentType());
        assertEquals("photo.jpg", asset.getFilename());
    }

    @Test
    @DisplayName("shouldIssueEmptyTicketsAndRejectMissingAssets")
    void shouldIssueEmptyTicketsAndRejectMissingAssets() {
        var course = Given.course(teacher, "Images", CourseStatus.DRAFT, List.of());
        assertTrue(courseImageAssetService.issueTickets(course.getId(), null, teacher).isEmpty());
        assertTrue(courseImageAssetService.issueTickets(course.getId(), List.of(), teacher).isEmpty());

        var asset = courseImageAssetService.upload(course.getId(), "image/png", "ok.png", TINY_PNG, teacher);
        assertThrows(CursosException.class,
                     () -> courseImageAssetService.issueTickets(course.getId(), List.of(asset.getId(), 99999L), teacher));
    }

    @Test
    @DisplayName("shouldForbidCoverTicketForUnpublishedNonTeacher")
    void shouldForbidCoverTicketForUnpublishedNonTeacher() {
        var course = Given.course(teacher, "Images", CourseStatus.DRAFT, List.of());
        var asset = courseImageAssetService.upload(course.getId(), "image/png", "cover.png", TINY_PNG, teacher);
        courseImageAssetService.setCover(course.getId(), asset.getId(), teacher);

        assertThrows(CursosException.class,
                     () -> courseImageAssetService.issueTickets(course.getId(), List.of(asset.getId()), stranger));
    }

    @Test
    @DisplayName("shouldAcceptGifAndWebpAndAllowCoverTicketWhenPublished")
    void shouldAcceptGifAndWebpAndAllowCoverTicketWhenPublished() {
        var gif = new byte[] { 'G', 'I', 'F', '8', '9', 'a', 0, 0, 0, 0, 0, 0, 0, 0 };
        var webp = new byte[] { 'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P' };
        var course = Given.course(teacher, "Raster", CourseStatus.DRAFT, List.of());

        var gifAsset = courseImageAssetService.upload(course.getId(), "image/gif", "a.gif", gif, teacher);
        var webpAsset = courseImageAssetService.upload(course.getId(), "image/webp", "a.webp", webp, teacher);
        assertEquals("image/gif", gifAsset.getContentType());
        assertEquals("image/webp", webpAsset.getContentType());

        courseImageAssetService.setCover(course.getId(), gifAsset.getId(), teacher);
        courseService.publish(course.getId(), teacher);
        var tickets = courseImageAssetService.issueTickets(course.getId(), List.of(gifAsset.getId()), stranger);
        assertEquals(1, tickets.size());
        assertTrue(courseImageAssetService.signedUrlOrNull(courseService.require(course.getId())) != null);

        courseImageAssetService.clearCover(course.getId(), teacher);
        courseImageAssetService.delete(course.getId(), webpAsset.getId(), teacher);
    }
}
