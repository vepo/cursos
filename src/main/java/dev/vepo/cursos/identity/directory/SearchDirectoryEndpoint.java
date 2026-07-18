package dev.vepo.cursos.identity.directory;

import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.eclipse.microprofile.rest.client.inject.RestClient;

import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.infra.passport.PassportDirectoryPageResponse;
import dev.vepo.cursos.infra.passport.PassportRestClient;
import io.quarkus.security.Authenticated;
import jakarta.annotation.security.DenyAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;

@Path("/directory/users")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@DenyAll
@Tag(name = "Directory")
public class SearchDirectoryEndpoint {
    private final PassportRestClient passportRestClient;

    @Inject
    public SearchDirectoryEndpoint(@RestClient PassportRestClient passportRestClient) {
        this.passportRestClient = passportRestClient;
    }

    @GET
    @Authenticated
    @Operation(operationId = "searchDirectory")
    public PassportDirectoryPageResponse search(@HeaderParam(HttpHeaders.AUTHORIZATION) String authorization,
                                                @QueryParam("q") String q,
                                                @QueryParam("page") @DefaultValue("0") int page,
                                                @QueryParam("size") @DefaultValue("20") int size) {
        try {
            return passportRestClient.searchDirectory(authorization, q, page, size);
        } catch (WebApplicationException ex) {
            throw new CursosException(jakarta.ws.rs.core.Response.Status.fromStatusCode(ex.getResponse().getStatus()),
                                      "Directory search failed");
        }
    }
}
