package dev.vepo.cursos.infra;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

public class CursosException extends WebApplicationException {

    private static final long serialVersionUID = 1L;

    public CursosException(Response.Status status, String message) {
        super(message, status);
    }

    public static CursosException notFound(String message) {
        return new CursosException(Response.Status.NOT_FOUND, message);
    }

    public static CursosException forbidden(String message) {
        return new CursosException(Response.Status.FORBIDDEN, message);
    }

    public static CursosException badRequest(String message) {
        return new CursosException(Response.Status.BAD_REQUEST, message);
    }

    public static CursosException conflict(String message) {
        return new CursosException(Response.Status.CONFLICT, message);
    }

    public static CursosException serverError(String message) {
        return new CursosException(Response.Status.INTERNAL_SERVER_ERROR, message);
    }
}
