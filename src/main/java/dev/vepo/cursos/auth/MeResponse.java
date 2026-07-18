package dev.vepo.cursos.auth;

import java.util.Set;

import dev.vepo.cursos.identity.PassportUser;

public record MeResponse(long id, String username, String name, String email, Set<String> roles) {
    public static MeResponse load(PassportUser user, Set<String> roles) {
        return new MeResponse(user.id(), user.username(), user.name(), user.email(), roles);
    }
}
