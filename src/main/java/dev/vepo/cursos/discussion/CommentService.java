package dev.vepo.cursos.discussion;

import java.util.List;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.study.StudyService;

@ApplicationScoped
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentUpvoteRepository commentUpvoteRepository;
    private final StudyService studyService;

    @Inject
    public CommentService(CommentRepository commentRepository,
                          CommentUpvoteRepository commentUpvoteRepository,
                          StudyService studyService) {
        this.commentRepository = commentRepository;
        this.commentUpvoteRepository = commentUpvoteRepository;
        this.studyService = studyService;
    }

    public List<CommentResponse> listAccessibleComments(long courseId, long itemId, PassportUser viewer) {
        var item = studyService.requireAccessibleItem(courseId, itemId, viewer);
        var comments = item.getCourse().isTaughtBy(viewer.id()) ? commentRepository.listByCourseItem(itemId)
                                                                : commentRepository.listVisibleByCourseItem(itemId);
        var upvotesByComment = commentUpvoteRepository.summarizeByComments(comments.stream().map(Comment::getId).toList(),
                                                                           viewer.id());
        return comments.stream().map(comment -> {
            var upvotes = upvotesByComment.get(comment.getId());
            return upvotes == null ? CommentResponse.load(comment, 0, false)
                                   : CommentResponse.load(comment, upvotes.count(), upvotes.callerUpvoted());
        }).toList();
    }

    @Transactional
    public CommentResponse createComment(long courseId, long itemId, CreateCommentRequest request, PassportUser author) {
        var item = studyService.requireAccessibleItem(courseId, itemId, author);
        if (request == null || request.content() == null || request.content().isBlank()) {
            throw CursosException.badRequest("Comment content is required");
        }
        return response(commentRepository.save(new Comment(item, author, request.content().trim())), author);
    }

    @Transactional
    public CommentResponse toggleCommentUpvote(long commentId, PassportUser voter) {
        var comment = require(commentId);
        var item = comment.getCourseItem();
        studyService.requireAccessibleItem(item.getCourse().getId(), item.getId(), voter);
        commentUpvoteRepository.findByCommentAndVoter(commentId, voter.id())
                               .ifPresentOrElse(commentUpvoteRepository::delete,
                                                () -> commentUpvoteRepository.save(new CommentUpvote(comment, voter)));
        return response(comment, voter);
    }

    @Transactional
    public CommentResponse hideComment(long commentId, PassportUser teacher) {
        var comment = requireCommentTeacherMayModerate(commentId, teacher);
        comment.hide(teacher);
        commentRepository.save(comment);
        return response(comment, teacher);
    }

    @Transactional
    public CommentResponse restoreComment(long commentId, PassportUser teacher) {
        var comment = requireCommentTeacherMayModerate(commentId, teacher);
        comment.restore();
        commentRepository.save(comment);
        return response(comment, teacher);
    }

    private Comment require(long commentId) {
        return commentRepository.findById(commentId)
                                .orElseThrow(() -> CursosException.notFound("Comment not found: %d".formatted(commentId)));
    }

    private Comment requireCommentTeacherMayModerate(long commentId, PassportUser teacher) {
        var comment = require(commentId);
        if (!comment.getCourseItem().getCourse().isTaughtBy(teacher.id())) {
            throw CursosException.forbidden("Only the course teacher may moderate comments");
        }
        return comment;
    }

    private CommentResponse response(Comment comment, PassportUser viewer) {
        return CommentResponse.load(comment,
                                    commentUpvoteRepository.countByComment(comment.getId()),
                                    commentUpvoteRepository.findByCommentAndVoter(comment.getId(), viewer.id()).isPresent());
    }
}
