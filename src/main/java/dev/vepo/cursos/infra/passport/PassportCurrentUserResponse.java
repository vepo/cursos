package dev.vepo.cursos.infra.passport;

import java.util.Set;

public record PassportCurrentUserResponse(long id, String username, String name, String email, Set<String> roles) {}
