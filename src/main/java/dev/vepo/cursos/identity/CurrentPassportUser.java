package dev.vepo.cursos.identity;

import org.eclipse.microprofile.jwt.JsonWebToken;

import dev.vepo.cursos.infra.CursosException;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;

@RequestScoped
public class CurrentPassportUser {

    private final JsonWebToken jwt;

    @Inject
    public CurrentPassportUser(JsonWebToken jwt) {
        this.jwt = jwt;
    }

    public PassportUser require() {
        if (jwt == null || jwt.getClaim("id") == null) {
            throw CursosException.forbidden("Authenticated Passport user required");
        }
        var idClaim = jwt.getClaim("id");
        long id = idClaim instanceof Number n ? n.longValue() : Long.parseLong(idClaim.toString());
        var username = jwt.getClaim("username") != null ? jwt.getClaim("username").toString() : jwt.getName();
        var email = jwt.getClaim("email") != null ? jwt.getClaim("email").toString() : "";
        var name = jwt.getClaim("name") != null ? jwt.getClaim("name").toString() : username;
        return new PassportUser(id, username, name, email);
    }
}
