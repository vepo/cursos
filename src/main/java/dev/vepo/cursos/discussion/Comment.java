package dev.vepo.cursos.discussion;

import java.time.Instant;

import dev.vepo.cursos.course.CourseItem;
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

@Entity
@Table(name = "tb_comments")
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_item_id", nullable = false)
    private CourseItem courseItem;

    @Column(name = "author_passport_user_id", nullable = false)
    private long authorPassportUserId;

    @Column(name = "author_username", nullable = false, length = 64)
    private String authorUsername;

    @Column(name = "author_name", nullable = false, length = 200)
    private String authorName;

    @Column(name = "author_email", nullable = false, length = 320)
    private String authorEmail;

    @Column(nullable = false)
    private String content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "hidden_at")
    private Instant hiddenAt;

    @Column(name = "moderator_passport_user_id")
    private Long moderatorPassportUserId;

    @Column(name = "moderator_username", length = 64)
    private String moderatorUsername;

    @Column(name = "moderator_name", length = 200)
    private String moderatorName;

    @Column(name = "moderator_email", length = 320)
    private String moderatorEmail;

    protected Comment() {}

    public Comment(CourseItem courseItem, PassportUser author, String content) {
        this.courseItem = courseItem;
        this.authorPassportUserId = author.id();
        this.authorUsername = author.username();
        this.authorName = author.name();
        this.authorEmail = author.email();
        this.content = content;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public CourseItem getCourseItem() {
        return courseItem;
    }

    public long getAuthorPassportUserId() {
        return authorPassportUserId;
    }

    public String getAuthorUsername() {
        return authorUsername;
    }

    public String getAuthorName() {
        return authorName;
    }

    public String getAuthorEmail() {
        return authorEmail;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getHiddenAt() {
        return hiddenAt;
    }

    public Long getModeratorPassportUserId() {
        return moderatorPassportUserId;
    }

    public String getModeratorUsername() {
        return moderatorUsername;
    }

    public String getModeratorName() {
        return moderatorName;
    }

    public String getModeratorEmail() {
        return moderatorEmail;
    }

    public void hide(PassportUser moderator) {
        this.hiddenAt = Instant.now();
        this.moderatorPassportUserId = moderator.id();
        this.moderatorUsername = moderator.username();
        this.moderatorName = moderator.name();
        this.moderatorEmail = moderator.email();
    }

    public void restore() {
        this.hiddenAt = null;
        this.moderatorPassportUserId = null;
        this.moderatorUsername = null;
        this.moderatorName = null;
        this.moderatorEmail = null;
    }
}
