package dev.vepo.cursos.account.password;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import dev.vepo.cursos.account.ChangeAccountPasswordRequest;
import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.infra.passport.PassportChangePasswordRequest;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/account/change-password")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Account")
public class ChangeAccountPasswordEndpoint {

    private final PassportRestClient passportRestClient;

    @Inject
    public ChangeAccountPasswordEndpoint(@RestClient PassportRestClient passportRestClient) {
        this.passportRestClient = passportRestClient;
    }

    @POST
    @Authenticated
    @Operation(operationId = "changeAccountPassword")
    public Response changePassword(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorization,
                                   @Valid ChangeAccountPasswordRequest request) {
        try {
            var passportResponse = passportRestClient.changePassword(authorization,
                                                                     new PassportChangePasswordRequest(request.currentPassword(),
                                                                                                       request.newPassword()));
            return Response.status(passportResponse.getStatus()).build();
        } catch (WebApplicationException ex) {
            throw new CursosException(jakarta.ws.rs.core.Response.Status.fromStatusCode(ex.getResponse().getStatus()),
                                      "Failed to change password");
        }
    }
}