package dev.vepo.cursos.auth;

import java.util.Set;

import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.passport.PassportCurrentUserResponse;

public record MeResponse(long id, String username, String name, String email, String description, Set<String> roles) {
    public static MeResponse load(PassportUser user, Set<String> roles) {
        return new MeResponse(user.id(), user.username(), user.name(), user.email(), "", roles);
    }

    public static MeResponse load(PassportCurrentUserResponse user) {
        return new MeResponse(user.id(),
                              user.username(),
                              user.name(),
                              user.email(),
                              user.description() != null ? user.description() : "",
                              user.roles() != null ? user.roles() : Set.of());
    }
}
