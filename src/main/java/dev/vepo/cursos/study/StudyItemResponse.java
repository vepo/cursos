package dev.vepo.cursos.study;

import dev.vepo.cursos.course.AulaBlockType;

public record StudyItemResponse(
                                long id,
                                String title,
                                int sortOrder,
                                boolean completed,
                                boolean accessible,
                                AulaBlockType firstBlockType) {}
