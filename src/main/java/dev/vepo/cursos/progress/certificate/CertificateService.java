package dev.vepo.cursos.progress.certificate;

import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import dev.vepo.cursos.course.CourseService;
import dev.vepo.cursos.enrollment.EnrollmentService;
import dev.vepo.cursos.identity.PassportUser;
import dev.vepo.cursos.infra.CursosException;
import dev.vepo.cursos.progress.ProgressService;

@ApplicationScoped
public class CertificateService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("d 'de' MMMM 'de' uuuu",
                                                                                     Locale.forLanguageTag("pt-BR"));

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final ProgressService progressService;

    @Inject
    public CertificateService(CourseService courseService,
                              EnrollmentService enrollmentService,
                              ProgressService progressService) {
        this.courseService = courseService;
        this.enrollmentService = enrollmentService;
        this.progressService = progressService;
    }

    public CertificatePdf issueForCourse(long courseId, PassportUser student) {
        var course = courseService.require(courseId);
        var enrollment = enrollmentService.requireEnrolledStudent(courseId, student.id());
        progressService.requireConcludedEnrollment(enrollment);
        if (enrollment.getConcludedAt() == null) {
            throw CursosException.forbidden("Certificate is available only after the course is concluded");
        }
        var concludedLocal = enrollment.getConcludedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        var bytes = renderPdf(enrollment.getStudentName(),
                              course.getTitle(),
                              course.getTeacherName(),
                              DATE_FORMAT.format(concludedLocal));
        var filename = "certificado-curso-%d.pdf".formatted(courseId);
        return new CertificatePdf(filename, bytes);
    }

    private byte[] renderPdf(String studentName, String courseTitle, String teacherName, String concludedDate) {
        try {
            var output = new ByteArrayOutputStream();
            var document = new Document(PageSize.A4.rotate(), 48, 48, 48, 48);
            PdfWriter.getInstance(document, output);
            document.open();

            var titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 28);
            var bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 14);
            var emphasisFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);

            var heading = new Paragraph("Certificado de conclusão", titleFont);
            heading.setAlignment(Element.ALIGN_CENTER);
            heading.setSpacingAfter(24);
            document.add(heading);

            var intro = new Paragraph("Certificamos que", bodyFont);
            intro.setAlignment(Element.ALIGN_CENTER);
            document.add(intro);

            var student = new Paragraph(studentName, emphasisFont);
            student.setAlignment(Element.ALIGN_CENTER);
            student.setSpacingBefore(12);
            student.setSpacingAfter(12);
            document.add(student);

            var courseLine = new Paragraph("concluiu o curso \"%s\".".formatted(courseTitle), bodyFont);
            courseLine.setAlignment(Element.ALIGN_CENTER);
            document.add(courseLine);

            var teacherLine = new Paragraph("Professor(a): %s".formatted(teacherName), bodyFont);
            teacherLine.setAlignment(Element.ALIGN_CENTER);
            teacherLine.setSpacingBefore(18);
            document.add(teacherLine);

            var dateLine = new Paragraph("Concluído em %s".formatted(concludedDate), bodyFont);
            dateLine.setAlignment(Element.ALIGN_CENTER);
            dateLine.setSpacingBefore(12);
            document.add(dateLine);

            var brand = new Paragraph("Cursos", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 12));
            brand.setAlignment(Element.ALIGN_CENTER);
            brand.setSpacingBefore(36);
            document.add(brand);

            document.close();
            return output.toByteArray();
        } catch (Exception e) {
            throw CursosException.serverError("Failed to generate certificate PDF");
        }
    }
}
