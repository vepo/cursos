package dev.vepo.cursos.infra.passport;

import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api")
@RegisterRestClient(configKey = "passport-api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface PassportRestClient {

    @POST
    @Path("/auth/login")
    PassportLoginResponse login(PassportLoginRequest request);

    @GET
    @Path("/auth/me")
    PassportCurrentUserResponse me(@HeaderParam("Authorization") String authorization);

    @PUT
    @Path("/auth/me")
    PassportCurrentUserResponse updateMe(@HeaderParam("Authorization") String authorization,
                                         PassportUpdateCurrentUserRequest request);

    @POST
    @Path("/auth/change-password")
    Response changePassword(@HeaderParam("Authorization") String authorization,
                            PassportChangePasswordRequest request);

    @GET
    @Path("/directory/users")
    PassportDirectoryPageResponse searchDirectory(@HeaderParam("Authorization") String authorization,
                                                  @QueryParam("q") String q,
                                                  @QueryParam("page") int page,
                                                  @QueryParam("size") int size);

    @POST
    @Path("/directory/authors")
    java.util.List<PassportPublicAuthorResponse> lookupAuthors(@HeaderParam("Authorization") String authorization,
                                                               PassportLookupAuthorsRequest request);
}
