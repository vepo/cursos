package dev.vepo.cursos.account;

import java.util.Set;

import dev.vepo.cursos.infra.passport.PassportCurrentUserResponse;

public record AccountResponse(long id, String username, String name, String email, String description, Set<String> roles) {
    public static AccountResponse load(PassportCurrentUserResponse user) {
        return new AccountResponse(user.id(),
                                   user.username(),
                                   user.name(),
                                   user.email(),
                                   user.description() != null ? user.description() : "",
                                   user.roles());
    }
}
