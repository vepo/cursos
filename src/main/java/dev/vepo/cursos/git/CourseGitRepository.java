package dev.vepo.cursos.git;

import java.time.Instant;

import dev.vepo.cursos.course.Course;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "tb_course_git_repositories")
public class CourseGitRepository {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false, unique = true)
    private Course course;

    @Column(name = "remote_url", nullable = false, length = 1000)
    private String remoteUrl;

    @Column(name = "default_branch", nullable = false, length = 200)
    private String defaultBranch;

    @Column(name = "description_path", nullable = false, length = 500)
    private String descriptionPath;

    @Column(name = "last_synced_sha", length = 64)
    private String lastSyncedSha;

    @Column(name = "last_synced_at")
    private Instant lastSyncedAt;

    @Column(nullable = false, length = 40)
    private String status;

    @Column(name = "error_summary")
    private String errorSummary;

    @Column(name = "webhook_secret_hash", length = 200)
    private String webhookSecretHash;

    protected CourseGitRepository() {}

    public CourseGitRepository(Course course, String remoteUrl, String defaultBranch, String descriptionPath) {
        this.course = course;
        this.remoteUrl = remoteUrl;
        this.defaultBranch = defaultBranch != null && !defaultBranch.isBlank() ? defaultBranch : "main";
        this.descriptionPath = descriptionPath != null && !descriptionPath.isBlank() ? descriptionPath : "course.yml";
        this.status = "LINKED";
    }

    public Long getId() {
        return id;
    }

    public Course getCourse() {
        return course;
    }

    public String getRemoteUrl() {
        return remoteUrl;
    }

    public String getDefaultBranch() {
        return defaultBranch;
    }

    public String getDescriptionPath() {
        return descriptionPath;
    }

    public String getLastSyncedSha() {
        return lastSyncedSha;
    }

    public Instant getLastSyncedAt() {
        return lastSyncedAt;
    }

    public String getStatus() {
        return status;
    }

    public String getErrorSummary() {
        return errorSummary;
    }

    public void updateLink(String remoteUrl, String defaultBranch, String descriptionPath) {
        this.remoteUrl = remoteUrl;
        this.defaultBranch = defaultBranch != null && !defaultBranch.isBlank() ? defaultBranch : "main";
        this.descriptionPath = descriptionPath != null && !descriptionPath.isBlank() ? descriptionPath : "course.yml";
        this.status = "LINKED";
        this.errorSummary = null;
    }

    public void markSynced(String sha) {
        this.lastSyncedSha = sha;
        this.lastSyncedAt = Instant.now();
        this.status = "SYNCED";
        this.errorSummary = null;
    }

    public void markFailed(String errorSummary) {
        this.status = "FAILED";
        this.errorSummary = errorSummary;
        this.lastSyncedAt = Instant.now();
    }
}
