package dev.vepo.cursos.infra;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.Priority;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(0)
public class CursosWebExceptionMapper implements ExceptionMapper<WebApplicationException> {

    private static final Logger logger = LoggerFactory.getLogger(CursosWebExceptionMapper.class);

    @Override
    public Response toResponse(WebApplicationException exception) {
        var status = exception.getResponse() != null ? exception.getResponse().getStatus() : 500;
        if (status >= 500) {
            logger.error("Request failed", exception);
        }
        return Response.status(status)
                       .type(MediaType.APPLICATION_JSON)
                       .entity(new ErrorResponse(status, exception.getMessage()))
                       .build();
    }
}
