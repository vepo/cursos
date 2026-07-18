package dev.vepo.cursos;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import dev.vepo.cursos.category.Category;
import dev.vepo.cursos.category.CategoryRepository;
import dev.vepo.cursos.course.Course;
import dev.vepo.cursos.course.CourseItem;
import dev.vepo.cursos.course.CourseItemRepository;
import dev.vepo.cursos.course.CourseItemType;
import dev.vepo.cursos.course.CourseRepository;
import dev.vepo.cursos.course.CourseStatus;
import dev.vepo.cursos.enrollment.Enrollment;
import dev.vepo.cursos.enrollment.EnrollmentRepository;
import dev.vepo.cursos.enrollment.EnrollmentStatus;
import dev.vepo.cursos.identity.PassportUser;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.restassured.http.Header;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.inject.spi.CDI;
import jakarta.persistence.EntityManager;

public final class Given {

    private Given() {}

    public static void cleanup() {
        withTransaction(() -> {
            var em = inject(EntityManager.class);
            em.createQuery("DELETE FROM ItemProgress").executeUpdate();
            em.createQuery("DELETE FROM Enrollment").executeUpdate();
            em.createQuery("DELETE FROM CourseItem").executeUpdate();
            em.createQuery("DELETE FROM CourseGitRepository").executeUpdate();
            em.createQuery("DELETE FROM Course").executeUpdate();
            em.createQuery("DELETE FROM CourseResource").executeUpdate();
            em.createQuery("DELETE FROM Category").executeUpdate();
        });
    }

    public static Header authenticated(long id, String username, String name, String email) {
        var token = Jwt.issuer("https://passport.vepo.dev")
                       .upn(username)
                       .claim("username", username)
                       .claim("id", id)
                       .claim("email", email)
                       .claim("name", name)
                       .groups(Set.of("USER"))
                       .issuedAt(Instant.now())
                       .expiresAt(Instant.now().plus(1, ChronoUnit.DAYS))
                       .sign();
        return new Header("Authorization", "Bearer %s".formatted(token));
    }

    public static Category category(String name, String slug) {
        return withTransaction(() -> inject(CategoryRepository.class).save(new Category(name, slug)));
    }

    public static Course course(PassportUser teacher, String title, CourseStatus status, List<Long> categoryIds) {
        return withTransaction(() -> {
            var course = inject(CourseRepository.class).save(new Course(title, "Summary for %s".formatted(title), teacher));
            if (categoryIds != null && !categoryIds.isEmpty()) {
                var categories = new HashSet<>(inject(CategoryRepository.class).findByIds(categoryIds));
                course.replaceCategories(categories);
            }
            if (status == CourseStatus.PUBLISHED) {
                course.publish();
            }
            return course;
        });
    }

    public static CourseItem markdownItem(Course course, String title, String body) {
        return withTransaction(() -> {
            var order = inject(CourseItemRepository.class).countByCourse(course.getId());
            var item = new CourseItem(inject(CourseRepository.class).findById(course.getId()).orElseThrow(), title, CourseItemType.MARKDOWN, order);
            item.updateMarkdown(body);
            return inject(CourseItemRepository.class).save(item);
        });
    }

    public static Enrollment enrollment(Course course, PassportUser student, EnrollmentStatus status) {
        return withTransaction(() -> inject(EnrollmentRepository.class).save(new Enrollment(inject(CourseRepository.class).findById(course.getId())
                                                                                                                          .orElseThrow(),
                                                                                            student,
                                                                                            status)));
    }

    public static PassportUser user(long id, String username) {
        return new PassportUser(id, username, username, "%s@example.com".formatted(username));
    }

    private static <T> T inject(Class<T> type) {
        return CDI.current().select(type).get();
    }

    private static <T> T withTransaction(java.util.concurrent.Callable<T> work) {
        return QuarkusTransaction.requiringNew().call(() -> {
            try {
                return work.call();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        });
    }

    private static void withTransaction(Runnable work) {
        QuarkusTransaction.requiringNew().run(work);
    }
}
