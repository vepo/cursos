package dev.vepo.cursos.infra.passport;

public record PassportChangePasswordRequest(String currentPassword, String newPassword) {}
