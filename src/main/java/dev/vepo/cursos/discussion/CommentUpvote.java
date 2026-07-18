package dev.vepo.cursos.discussion;

import java.time.Instant;

import dev.vepo.cursos.identity.PassportUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "tb_comment_upvotes", uniqueConstraints = @UniqueConstraint(columnNames = { "comment_id", "voter_passport_user_id" }))
public class CommentUpvote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id", nullable = false)
    private Comment comment;

    @Column(name = "voter_passport_user_id", nullable = false)
    private long voterPassportUserId;

    @Column(name = "voter_username", nullable = false, length = 64)
    private String voterUsername;

    @Column(name = "voter_name", nullable = false, length = 200)
    private String voterName;

    @Column(name = "voter_email", nullable = false, length = 320)
    private String voterEmail;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CommentUpvote() {}

    public CommentUpvote(Comment comment, PassportUser voter) {
        this.comment = comment;
        this.voterPassportUserId = voter.id();
        this.voterUsername = voter.username();
        this.voterName = voter.name();
        this.voterEmail = voter.email();
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Comment getComment() {
        return comment;
    }

    public long getVoterPassportUserId() {
        return voterPassportUserId;
    }

    public String getVoterUsername() {
        return voterUsername;
    }

    public String getVoterName() {
        return voterName;
    }

    public String getVoterEmail() {
        return voterEmail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
