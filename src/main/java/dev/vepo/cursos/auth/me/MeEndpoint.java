package dev.vepo.cursos.auth.me;

import java.util.Set;
import java.util.stream.Collectors;

import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import dev.vepo.cursos.auth.MeResponse;
import dev.vepo.cursos.identity.CurrentPassportUser;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/auth/me")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Auth")
public class MeEndpoint {

    private final CurrentPassportUser currentPassportUser;
    private final JsonWebToken jwt;
    private final PassportRestClient passportRestClient;

    @Inject
    public MeEndpoint(CurrentPassportUser currentPassportUser,
                      JsonWebToken jwt,
                      @RestClient PassportRestClient passportRestClient) {
        this.currentPassportUser = currentPassportUser;
        this.jwt = jwt;
        this.passportRestClient = passportRestClient;
    }

    @GET
    @Authenticated
    @Operation(operationId = "me")
    public MeResponse me(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorization) {
        try {
            return MeResponse.load(passportRestClient.me(authorization));
        } catch (RuntimeException ex) {
            var user = currentPassportUser.require();
            Set<String> roles = jwt.getGroups() != null ? jwt.getGroups().stream().collect(Collectors.toSet()) : Set.of();
            return MeResponse.load(user, roles);
        }
    }
}
