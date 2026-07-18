package dev.vepo.cursos.course;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

import dev.vepo.cursos.category.Category;
import dev.vepo.cursos.identity.PassportUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;

@Entity
@Table(name = "tb_courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 2000)
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CourseStatus status;

    @Column(name = "teacher_passport_user_id", nullable = false)
    private long teacherPassportUserId;

    @Column(name = "teacher_username", nullable = false, length = 64)
    private String teacherUsername;

    @Column(name = "teacher_name", nullable = false, length = 200)
    private String teacherName;

    @Column(name = "teacher_email", nullable = false, length = 320)
    private String teacherEmail;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @ManyToMany
    @JoinTable(name = "tb_course_categories", joinColumns = @JoinColumn(name = "course_id"), inverseJoinColumns = @JoinColumn(name = "category_id"))
    private Set<Category> categories = new HashSet<>();

    protected Course() {}

    public Course(String title, String summary, PassportUser teacher) {
        this.title = title;
        this.summary = summary != null ? summary : "";
        this.status = CourseStatus.DRAFT;
        this.teacherPassportUserId = teacher.id();
        this.teacherUsername = teacher.username();
        this.teacherName = teacher.name();
        this.teacherEmail = teacher.email();
        var now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public CourseStatus getStatus() {
        return status;
    }

    public long getTeacherPassportUserId() {
        return teacherPassportUserId;
    }

    public String getTeacherUsername() {
        return teacherUsername;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public String getTeacherEmail() {
        return teacherEmail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<Category> getCategories() {
        return categories;
    }

    public boolean isTaughtBy(long passportUserId) {
        return teacherPassportUserId == passportUserId;
    }

    public void updateDetails(String title, String summary) {
        this.title = title;
        this.summary = summary != null ? summary : "";
        this.updatedAt = Instant.now();
    }

    public void replaceCategories(Set<Category> categories) {
        this.categories.clear();
        this.categories.addAll(categories);
        this.updatedAt = Instant.now();
    }

    public void publish() {
        this.status = CourseStatus.PUBLISHED;
        this.updatedAt = Instant.now();
    }

    public void unpublish() {
        this.status = CourseStatus.DRAFT;
        this.updatedAt = Instant.now();
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }
}
