package dev.vepo.cursos.course;

import java.time.Instant;

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

@Entity
@Table(name = "tb_course_items")
public class CourseItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private CourseItemType itemType;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "markdown_body")
    private String markdownBody;

    @Column(name = "link_url", length = 2000)
    private String linkUrl;

    @Column(name = "link_description", length = 2000)
    private String linkDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    private CourseResource resource;

    @Column(name = "source_path", length = 500)
    private String sourcePath;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CourseItem() {}

    public CourseItem(Course course, String title, CourseItemType itemType, int sortOrder) {
        this.course = course;
        this.title = title;
        this.itemType = itemType;
        this.sortOrder = sortOrder;
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

    public String getTitle() {
        return title;
    }

    public CourseItemType getItemType() {
        return itemType;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public String getMarkdownBody() {
        return markdownBody;
    }

    public String getLinkUrl() {
        return linkUrl;
    }

    public String getLinkDescription() {
        return linkDescription;
    }

    public CourseResource getResource() {
        return resource;
    }

    public String getSourcePath() {
        return sourcePath;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void updateTitle(String title) {
        this.title = title;
        this.updatedAt = Instant.now();
    }

    public void updateMarkdown(String markdownBody) {
        this.markdownBody = markdownBody;
        this.updatedAt = Instant.now();
    }

    public void updateLink(String linkUrl, String linkDescription) {
        this.linkUrl = linkUrl;
        this.linkDescription = linkDescription != null ? linkDescription : "";
        this.updatedAt = Instant.now();
    }

    public void assignResource(CourseResource resource) {
        this.resource = resource;
        this.updatedAt = Instant.now();
    }

    public void reorder(int sortOrder) {
        this.sortOrder = sortOrder;
        this.updatedAt = Instant.now();
    }

    public void bindSourcePath(String sourcePath) {
        this.sourcePath = sourcePath;
        this.updatedAt = Instant.now();
    }
}
