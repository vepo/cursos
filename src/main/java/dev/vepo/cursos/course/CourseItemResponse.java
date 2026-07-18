package dev.vepo.cursos.course;

public record CourseItemResponse(
                                 long id,
                                 long courseId,
                                 String title,
                                 CourseItemType itemType,
                                 int sortOrder,
                                 String markdownBody,
                                 String linkUrl,
                                 String linkDescription,
                                 Long resourceId,
                                 String sourcePath) {

    public static CourseItemResponse load(CourseItem item) {
        return new CourseItemResponse(item.getId(),
                                      item.getCourse().getId(),
                                      item.getTitle(),
                                      item.getItemType(),
                                      item.getSortOrder(),
                                      item.getItemType() == CourseItemType.MARKDOWN ? item.getMarkdownBody() : null,
                                      item.getItemType() == CourseItemType.LINK ? item.getLinkUrl() : null,
                                      item.getItemType() == CourseItemType.LINK ? item.getLinkDescription() : null,
                                      item.getResource() != null ? item.getResource().getId() : null,
                                      item.getSourcePath());
    }
}
