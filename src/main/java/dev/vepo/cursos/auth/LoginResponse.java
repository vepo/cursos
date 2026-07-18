package dev.vepo.cursos.auth;

import java.util.Set;

import dev.vepo.cursos.infra.passport.PassportLoginResponse;

public record LoginResponse(String token, UserInfo user) {
    public record UserInfo(Long id, String username, String name, String email, Set<String> profiles) {}

    public static LoginResponse load(PassportLoginResponse passport) {
        var user = passport.user();
        return new LoginResponse(passport.token(),
                                 new UserInfo(user.id(), user.username(), user.name(), user.email(), user.profiles()));
    }
}
