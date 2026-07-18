package dev.vepo.cursos.enrollment;

import java.time.Instant;

public record EnrollmentResponse(
                                 long id,
                                 long courseId,
                                 long studentPassportUserId,
                                 String studentUsername,
                                 String studentName,
                                 String studentEmail,
                                 EnrollmentStatus status,
                                 Instant createdAt,
                                 Instant updatedAt) {

    public static EnrollmentResponse load(Enrollment enrollment) {
        return new EnrollmentResponse(enrollment.getId(),
                                      enrollment.getCourse().getId(),
                                      enrollment.getStudentPassportUserId(),
                                      enrollment.getStudentUsername(),
                                      enrollment.getStudentName(),
                                      enrollment.getStudentEmail(),
                                      enrollment.getStatus(),
                                      enrollment.getCreatedAt(),
                                      enrollment.getUpdatedAt());
    }
}
