package dev.vepo.cursos.infra.passport;

import java.util.Set;

public record PassportLoginResponse(String token, PassportUserInfo user) {
    public record PassportUserInfo(Long id, String username, String name, String email, Set<String> profiles) {}
}
