package dev.vepo.cursos.study;

public record StudyItemResponse(
                                long id,
                                String title,
                                int sortOrder,
                                boolean completed,
                                boolean accessible) {}
