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
@Table(name = "tb_aula_blocks")
public class AulaBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_item_id", nullable = false)
    private CourseItem courseItem;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false, length = 20)
    private AulaBlockType blockType;

    @Column(name = "markdown_body")
    private String markdownBody;

    @Column(name = "link_url", length = 2000)
    private String linkUrl;

    @Column(name = "link_description", length = 2000)
    private String linkDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    private CourseResource resource;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AulaBlock() {}

    public AulaBlock(CourseItem courseItem, AulaBlockType blockType, int sortOrder) {
        this.courseItem = courseItem;
        this.blockType = blockType;
        this.sortOrder = sortOrder;
        var now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public CourseItem getCourseItem() {
        return courseItem;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public AulaBlockType getBlockType() {
        return blockType;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
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
}
