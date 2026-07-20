package dev.vepo.cursos.course;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

@QuarkusTest
@DisplayName("Course service")
class CourseServiceTest {

    @Inject
    CourseService courseService;

    private PassportUser teacher;
    private PassportUser stranger;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(140L, "svc-teacher");
        stranger = Given.user(141L, "svc-stranger");
    }

    @Test
    @DisplayName("shouldRejectInvalidMediaItemPayloads")
    void shouldRejectInvalidMediaItemPayloads() {
        var course = Given.course(teacher, "Media", CourseStatus.DRAFT, List.of());

        assertThrows(CursosException.class,
                     () -> courseService.addMediaItem(course.getId(), "t", CourseItemType.MARKDOWN, "image/png", "a.png", new byte[] { 1 }, teacher));
        assertThrows(CursosException.class,
                     () -> courseService.addMediaItem(course.getId(), " ", CourseItemType.IMAGE, "image/png", "a.png", new byte[] { 1 }, teacher));
        assertThrows(CursosException.class,
                     () -> courseService.addMediaItem(course.getId(), "t", CourseItemType.IMAGE, "image/png", " ", new byte[] { 1 }, teacher));
        assertThrows(CursosException.class,
                     () -> courseService.addMediaItem(course.getId(), "t", CourseItemType.IMAGE, "image/png", "a.png", null, teacher));
        assertThrows(CursosException.class,
                     () -> courseService.addMediaItem(course.getId(), "t", CourseItemType.IMAGE, "video/mp4", "a.png", new byte[] { 1 }, teacher));
        assertThrows(CursosException.class,
                     () -> courseService.addMediaItem(course.getId(), "t", CourseItemType.VIDEO, "image/png", "a.mp4", new byte[] { 1 }, teacher));
        assertThrows(CursosException.class,
                     () -> courseService.addMediaItem(course.getId(),
                                                      "t",
                                                      CourseItemType.VIDEO,
                                                      "video/mp4",
                                                      "a.mp4",
                                                      new byte[2_000_000],
                                                      teacher));
    }

    @Test
    @DisplayName("shouldRejectReorderDuplicatesIncompleteAndUnknownCategories")
    void shouldRejectReorderDuplicatesIncompleteAndUnknownCategories() {
        var course = Given.course(teacher, "Reorder", CourseStatus.DRAFT, List.of());
        var first = Given.markdownItem(course, "A", "# A");
        var second = Given.markdownItem(course, "B", "# B");

        assertThrows(CursosException.class, () -> courseService.reorder(course.getId(), List.of(), teacher));
        assertThrows(CursosException.class, () -> courseService.reorder(course.getId(), List.of(first.getId(), first.getId()), teacher));
        assertThrows(CursosException.class, () -> courseService.reorder(course.getId(), List.of(first.getId()), teacher));
        assertThrows(CursosException.class, () -> courseService.reorder(course.getId(), List.of(first.getId(), second.getId()), stranger));

        assertThrows(CursosException.class,
                     () -> courseService.create(new CreateCourseRequest("Bad cats", "s", List.of(999999L)), teacher));

        var updated = courseService.update(course.getId(), new UpdateCourseRequest("New title", "New summary", List.of()), teacher);
        assertEquals("New title", updated.getTitle());
        assertEquals("New summary", updated.getSummary());
        assertTrue(updated.getCategories().isEmpty());
    }

    @Test
    @DisplayName("shouldDeleteItemAndRequireVideoItemGuards")
    void shouldDeleteItemAndRequireVideoItemGuards() {
        var course = Given.course(teacher, "Delete", CourseStatus.DRAFT, List.of());
        var markdown = Given.markdownItem(course, "A", "# A");
        assertThrows(CursosException.class, () -> courseService.requireVideoItem(course.getId(), markdown.getId(), 1L));
        courseService.deleteItem(markdown.getId(), teacher);
        assertTrue(courseService.listItems(course.getId()).isEmpty());
        assertThrows(CursosException.class, () -> courseService.require(999999L));
        assertThrows(CursosException.class, () -> courseService.requireResource(999999L));
    }
}
