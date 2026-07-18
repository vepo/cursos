package dev.vepo.cursos.auth.login;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import dev.vepo.cursos.auth.LoginRequest;
import dev.vepo.cursos.auth.LoginResponse;
import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.infra.passport.PassportLoginRequest;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import jakarta.annotation.security.DenyAll;
import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;

@Path("/auth/login")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Auth")
public class LoginEndpoint {

    private final PassportRestClient passportRestClient;

    @Inject
    public LoginEndpoint(@RestClient PassportRestClient passportRestClient) {
        this.passportRestClient = passportRestClient;
    }

    @POST
    @PermitAll
    @Operation(operationId = "login")
    public LoginResponse login(@Valid LoginRequest request) {
        try {
            return LoginResponse.load(passportRestClient.login(new PassportLoginRequest(request.email(), request.password())));
        } catch (WebApplicationException ex) {
            throw new CursosException(jakarta.ws.rs.core.Response.Status.fromStatusCode(ex.getResponse().getStatus()),
                                      "Invalid credentials");
        }
    }
}
