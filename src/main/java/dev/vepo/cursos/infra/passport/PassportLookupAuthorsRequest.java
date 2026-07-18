package dev.vepo.cursos.infra.passport;

import java.util.List;

public record PassportLookupAuthorsRequest(List<Long> ids) {}
