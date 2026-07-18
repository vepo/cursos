package dev.vepo.cursos.account.update;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import dev.vepo.cursos.account.AccountResponse;
import dev.vepo.cursos.account.UpdateAccountRequest;
import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import dev.vepo.cursos.infra.passport.PassportUpdateCurrentUserRequest;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/account")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Account")
public class UpdateAccountEndpoint {

    private final PassportRestClient passportRestClient;

    @Inject
    public UpdateAccountEndpoint(@RestClient PassportRestClient passportRestClient) {
        this.passportRestClient = passportRestClient;
    }

    @PUT
    @Authenticated
    @Operation(operationId = "updateAccount")
    public AccountResponse update(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorization,
                                  @Valid UpdateAccountRequest request) {
        try {
            return AccountResponse.load(passportRestClient.updateMe(authorization,
                                                                    new PassportUpdateCurrentUserRequest(request.name(),
                                                                                                         request.email(),
                                                                                                         request.description())));
        } catch (WebApplicationException ex) {
            throw new CursosException(jakarta.ws.rs.core.Response.Status.fromStatusCode(ex.getResponse().getStatus()),
                                      "Failed to update account");
        }
    }
}
