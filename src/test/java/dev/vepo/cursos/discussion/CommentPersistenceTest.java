package dev.vepo.cursos.discussion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import dev.vepo.cursos.Given;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;

@QuarkusTest
@DisplayName("Comment and upvote persistence")
class CommentPersistenceTest {

    @Inject
    CommentRepository commentRepository;

    @Inject
    CommentUpvoteRepository commentUpvoteRepository;

    private PassportUser teacher;
    private PassportUser author;
    private PassportUser voter;

    @BeforeEach
    void setUp() {
        Given.cleanup();
        teacher = Given.user(10L, "teacher");
        author = Given.user(20L, "author");
        voter = Given.user(30L, "voter");
    }

    @Test
    @DisplayName("shouldPersistCommentAttachedToCourseItemWithAuthorIdentityAndModerationFields")
    void shouldPersistCommentAttachedToCourseItemWithAuthorIdentityAndModerationFields() {
        var course = Given.course(teacher, "Discussion Course", CourseStatus.PUBLISHED, null);
        var aula = Given.markdownItem(course, "Intro", "# Intro");

        var persisted = QuarkusTransaction.requiringNew()
                                          .call(() -> {
                                              var comment = commentRepository.save(new Comment(aula, author, "Great explanation"));
                                              comment.hide(teacher);
                                              return comment;
                                          });

        var reloaded = commentRepository.findById(persisted.getId()).orElseThrow();

        assertThat(reloaded.getId()).isEqualTo(persisted.getId());
        assertThat(reloaded.getCourseItem().getId()).isEqualTo(aula.getId());
        assertThat(reloaded.getAuthorPassportUserId()).isEqualTo(author.id());
        assertThat(reloaded.getAuthorUsername()).isEqualTo(author.username());
        assertThat(reloaded.getAuthorName()).isEqualTo(author.name());
        assertThat(reloaded.getAuthorEmail()).isEqualTo(author.email());
        assertThat(reloaded.getContent()).isEqualTo("Great explanation");
        assertThat(reloaded.getCreatedAt()).isNotNull();
        assertThat(reloaded.getHiddenAt()).isNotNull();
        assertThat(reloaded.getModeratorPassportUserId()).isEqualTo(teacher.id());
        assertThat(reloaded.getModeratorUsername()).isEqualTo(teacher.username());
    }

    @Test
    @DisplayName("shouldListVisibleCommentsSeparatelyFromAllIncludingHidden")
    void shouldListVisibleCommentsSeparatelyFromAllIncludingHidden() {
        var course = Given.course(teacher, "Visibility Course", CourseStatus.PUBLISHED, null);
        var aula = Given.markdownItem(course, "Intro", "# Intro");

        var visible = QuarkusTransaction.requiringNew()
                                        .call(() -> commentRepository.save(new Comment(aula, author, "Visible comment")));
        var hidden = QuarkusTransaction.requiringNew()
                                       .call(() -> {
                                           var comment = commentRepository.save(new Comment(aula, author, "Hidden comment"));
                                           comment.hide(teacher);
                                           return commentRepository.save(comment);
                                       });

        var visibleOnly = commentRepository.listVisibleByCourseItem(aula.getId());
        var all = commentRepository.listByCourseItem(aula.getId());

        assertThat(visibleOnly).extracting(Comment::getId).containsExactly(visible.getId());
        assertThat(all).extracting(Comment::getId).containsExactlyInAnyOrder(visible.getId(), hidden.getId());
    }

    @Test
    @DisplayName("shouldPersistCommentUpvoteForVoterAndRejectDuplicateUserCommentPair")
    void shouldPersistCommentUpvoteForVoterAndRejectDuplicateUserCommentPair() {
        var course = Given.course(teacher, "Upvote Course", CourseStatus.PUBLISHED, null);
        var aula = Given.markdownItem(course, "Intro", "# Intro");
        var comment = QuarkusTransaction.requiringNew()
                                        .call(() -> commentRepository.save(new Comment(aula, author, "Upvotable")));

        var upvote = QuarkusTransaction.requiringNew()
                                       .call(() -> commentUpvoteRepository.save(new CommentUpvote(comment, voter)));

        assertThat(upvote.getId()).isNotNull();
        assertThat(upvote.getComment().getId()).isEqualTo(comment.getId());
        assertThat(upvote.getVoterPassportUserId()).isEqualTo(voter.id());
        assertThat(upvote.getVoterUsername()).isEqualTo(voter.username());
        assertThat(upvote.getCreatedAt()).isNotNull();

        var found = commentUpvoteRepository.findByCommentAndVoter(comment.getId(), voter.id());
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(upvote.getId());

        assertThatThrownBy(() -> QuarkusTransaction.requiringNew()
                                                   .call(() -> commentUpvoteRepository.save(new CommentUpvote(comment, voter))))
                                                                                                                                .isInstanceOf(PersistenceException.class);
    }
}
