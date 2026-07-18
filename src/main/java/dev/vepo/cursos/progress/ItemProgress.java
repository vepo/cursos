package dev.vepo.cursos.progress;

import java.time.Instant;

import dev.vepo.cursos.course.CourseItem;
import dev.vepo.cursos.enrollment.Enrollment;
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
@Table(name = "tb_item_progress", uniqueConstraints = @UniqueConstraint(columnNames = { "enrollment_id", "course_item_id" }))
public class ItemProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enrollment_id", nullable = false)
    private Enrollment enrollment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_item_id", nullable = false)
    private CourseItem courseItem;

    @Column(nullable = false)
    private boolean completed;

    @Column(name = "actor_passport_user_id", nullable = false)
    private long actorPassportUserId;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ItemProgress() {}

    public ItemProgress(Enrollment enrollment, CourseItem courseItem, boolean completed, long actorPassportUserId) {
        this.enrollment = enrollment;
        this.courseItem = courseItem;
        this.completed = completed;
        this.actorPassportUserId = actorPassportUserId;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Enrollment getEnrollment() {
        return enrollment;
    }

    public CourseItem getCourseItem() {
        return courseItem;
    }

    public boolean isCompleted() {
        return completed;
    }

    public long getActorPassportUserId() {
        return actorPassportUserId;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void record(boolean completed, long actorPassportUserId) {
        this.completed = completed;
        this.actorPassportUserId = actorPassportUserId;
        this.updatedAt = Instant.now();
    }
}
