package dev.vepo.cursos.infra.passport;

import java.util.List;

public record PassportDirectoryPageResponse(List<PassportDirectoryUserResponse> items, int page, int size, long total) {}
