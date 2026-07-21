package dev.vepo.cursos.course;

import java.util.List;

public record CourseItemResponse(
                                 long id,
                                 long courseId,
                                 String title,
                                 int sortOrder,
                                 String sourcePath,
                                 List<AulaBlockResponse> blocks) {

    public static CourseItemResponse load(CourseItem item, List<AulaBlock> blocks) {
        return new CourseItemResponse(item.getId(),
                                      item.getCourse().getId(),
                                      item.getTitle(),
                                      item.getSortOrder(),
                                      item.getSourcePath(),
                                      blocks.stream().map(AulaBlockResponse::load).toList());
    }
}
