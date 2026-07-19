package dev.vepo.cursos.enrollment;

import java.time.Instant;

import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.identity.PassportUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "tb_enrollments", uniqueConstraints = @UniqueConstraint(columnNames = { "course_id", "student_passport_user_id" }))
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "student_passport_user_id", nullable = false)
    private long studentPassportUserId;

    @Column(name = "student_username", nullable = false, length = 64)
    private String studentUsername;

    @Column(name = "student_name", nullable = false, length = 200)
    private String studentName;

    @Column(name = "student_email", nullable = false, length = 320)
    private String studentEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EnrollmentStatus status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "concluded_at")
    private Instant concludedAt;

    protected Enrollment() {}

    public Enrollment(Course course, PassportUser student, EnrollmentStatus status) {
        this.course = course;
        this.studentPassportUserId = student.id();
        this.studentUsername = student.username();
        this.studentName = student.name();
        this.studentEmail = student.email();
        this.status = status;
        var now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public Course getCourse() {
        return course;
    }

    public long getStudentPassportUserId() {
        return studentPassportUserId;
    }

    public String getStudentUsername() {
        return studentUsername;
    }

    public String getStudentName() {
        return studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public EnrollmentStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getConcludedAt() {
        return concludedAt;
    }

    public boolean isConcluded() {
        return concludedAt != null;
    }

    public boolean belongsTo(long passportUserId) {
        return studentPassportUserId == passportUserId;
    }

    public void approve() {
        this.status = EnrollmentStatus.ENROLLED;
        this.updatedAt = Instant.now();
    }

    public void reject() {
        this.status = EnrollmentStatus.REJECTED;
        this.updatedAt = Instant.now();
    }

    public void markEnrolled() {
        this.status = EnrollmentStatus.ENROLLED;
        this.updatedAt = Instant.now();
    }

    public void reopenAsRequested() {
        this.status = EnrollmentStatus.REQUESTED;
        this.updatedAt = Instant.now();
    }

    public void markConcluded(Instant at) {
        this.concludedAt = at;
        this.updatedAt = Instant.now();
    }

    public void clearConclusion() {
        this.concludedAt = null;
        this.updatedAt = Instant.now();
    }
}
