package dev.vepo.cursos.mailer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class MailerService {

    private static final Logger logger = LoggerFactory.getLogger(MailerService.class);

    private final Mailer mailer;

    @Inject
    public MailerService(Mailer mailer) {
        this.mailer = mailer;
    }

    public void sendEnrollmentInvitation(Course course, PassportUser student) {
        var subject = "You were enrolled in %s".formatted(course.getTitle());
        var body = """
                   Hello %s,

                   %s enrolled you in the course "%s".

                   Open Cursos to start learning.
                   """.formatted(student.name(), course.getTeacherName(), course.getTitle());
        try {
            mailer.send(Mail.withText(student.email(), subject, body));
        } catch (RuntimeException ex) {
            logger.warn("Failed to send enrollment invitation to {}: {}", student.email(), ex.getMessage());
        }
    }
}
