package dev.vepo.cursos.study;

import java.util.List;

public record StudyResponse(long courseId, List<StudyItemResponse> items) {}
