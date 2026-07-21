package dev.vepo.cursos.course;

public record AulaBlockResponse(
                                long id,
                                long courseItemId,
                                AulaBlockType blockType,
                                int sortOrder,
                                String markdownBody,
                                String linkUrl,
                                String linkDescription,
                                Long resourceId) {

    public static AulaBlockResponse load(AulaBlock block) {
        return new AulaBlockResponse(block.getId(),
                                     block.getCourseItem().getId(),
                                     block.getBlockType(),
                                     block.getSortOrder(),
                                     block.getBlockType() == AulaBlockType.MARKDOWN ? block.getMarkdownBody() : null,
                                     block.getBlockType() == AulaBlockType.LINK ? block.getLinkUrl() : null,
                                     block.getBlockType() == AulaBlockType.LINK ? block.getLinkDescription() : null,
                                     block.getResource() != null ? block.getResource().getId() : null);
    }
}
