package dev.vepo.cursos.auth.me;

import java.util.Set;
import java.util.stream.Collectors;

import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import dev.vepo.cursos.auth.MeResponse;
import dev.vepo.cursos.identity.CurrentPassportUser;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/auth/me")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Auth")
public class MeEndpoint {

    private final CurrentPassportUser currentPassportUser;
    private final JsonWebToken jwt;

    @Inject
    public MeEndpoint(CurrentPassportUser currentPassportUser, JsonWebToken jwt) {
        this.currentPassportUser = currentPassportUser;
        this.jwt = jwt;
    }

    @GET
    @Authenticated
    @Operation(operationId = "me")
    public MeResponse me() {
        var user = currentPassportUser.require();
        Set<String> roles = jwt.getGroups() != null ? jwt.getGroups().stream().collect(Collectors.toSet()) : Set.of();
        return MeResponse.load(user, roles);
    }
}
