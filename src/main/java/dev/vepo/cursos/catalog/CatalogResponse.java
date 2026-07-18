package dev.vepo.cursos.catalog;

import java.util.List;

public record CatalogResponse(
                              List<CatalogCourseResponse> teaching,
                              List<CatalogCourseResponse> enrolled,
                              List<CatalogCourseResponse> available) {}
