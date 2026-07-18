package dev.vepo.cursos.identity;

public record AuthorProfile(long id, String username, String name, String description) {

    public static AuthorProfile fallback(long id, String username, String name) {
        return new AuthorProfile(id, username != null ? username : "", name != null ? name : "", "");
    }
}
