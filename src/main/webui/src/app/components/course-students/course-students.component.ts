import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CoursesApi } from '../../generated/api/courses.service';
import { DirectoryApi } from '../../generated/api/directory.service';
import { EnrollmentsApi } from '../../generated/api/enrollments.service';
import { EnrollmentResponse } from '../../generated/model/enrollmentResponse';
import { EnrollmentStatus } from '../../generated/model/enrollmentStatus';
import { PassportDirectoryUserResponse } from '../../generated/model/passportDirectoryUserResponse';
import { ConfirmationService } from '../../services/confirmation.service';

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  REQUESTED: 'Solicitado',
  ENROLLED: 'Matriculado',
  REJECTED: 'Recusado'
};

@Component({
  selector: 'app-course-students',
  templateUrl: './course-students.component.html',
  styleUrl: './course-students.component.scss',
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule]
})
export class CourseStudentsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly enrollmentsApi = inject(EnrollmentsApi);
  private readonly directoryApi = inject(DirectoryApi);
  private readonly coursesApi = inject(CoursesApi);
  private readonly confirmation = inject(ConfirmationService);

  courseId = 0;
  courseTitle = '';
  enrollments: EnrollmentResponse[] = [];
  query = '';
  matches: PassportDirectoryUserResponse[] = [];
  searched = false;
  message = '';
  error = '';
  actionInFlight = false;

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.coursesApi.findCourse(this.courseId).subscribe(detail => this.courseTitle = detail.course?.title ?? '');
    this.reload();
  }

  get pendingRequests(): EnrollmentResponse[] {
    return this.enrollments.filter(enrollment => enrollment.status === 'REQUESTED');
  }

  get enrolledStudents(): EnrollmentResponse[] {
    return this.enrollments.filter(enrollment => enrollment.status === 'ENROLLED');
  }

  get rejectedRequests(): EnrollmentResponse[] {
    return this.enrollments.filter(enrollment => enrollment.status === 'REJECTED');
  }

  statusLabel(status: EnrollmentStatus | undefined): string {
    return status ? STATUS_LABELS[status] : '';
  }

  directoryStatus(user: PassportDirectoryUserResponse): EnrollmentStatus | undefined {
    return this.enrollments
      .find(enrollment => enrollment.studentPassportUserId === user.id
          && enrollment.status !== 'REJECTED')?.status;
  }

  reload(): void {
    this.enrollmentsApi.listCourseEnrollments(this.courseId).subscribe(list => this.enrollments = list ?? []);
  }

  search(): void {
    this.clearFeedback();
    this.directoryApi.searchDirectory(0, this.query).subscribe(page => {
      this.matches = page.items ?? [];
      this.searched = true;
    });
  }

  approve(enrollment: EnrollmentResponse): void {
    this.clearFeedback();
    this.actionInFlight = true;
    this.enrollmentsApi.approveEnrollment(enrollment.id!).subscribe({
      next: () => this.finishAction(`Solicitação aprovada — ${enrollment.studentName} matriculado(a).`),
      error: () => this.failAction('Não foi possível aprovar a solicitação. Tente novamente.')
    });
  }

  reject(enrollment: EnrollmentResponse): void {
    this.confirmation.confirm({
      title: 'Recusar solicitação',
      message: `Recusar a solicitação de ${enrollment.studentName}?`,
      confirmLabel: 'Recusar',
      cancelLabel: 'Cancelar',
      destructive: true
    }).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.clearFeedback();
      this.actionInFlight = true;
      this.enrollmentsApi.rejectEnrollment(enrollment.id!).subscribe({
        next: () => this.finishAction(`Solicitação de ${enrollment.studentName} recusada.`),
        error: () => this.failAction('Não foi possível recusar a solicitação. Tente novamente.')
      });
    });
  }

  enroll(user: PassportDirectoryUserResponse): void {
    if (user.id == null || !user.username || !user.name || !user.email) {
      return;
    }
    this.clearFeedback();
    this.actionInFlight = true;
    this.enrollmentsApi.directEnroll(this.courseId, {
      passportUserId: user.id,
      username: user.username,
      name: user.name,
      email: user.email
    }).subscribe({
      next: () => {
        this.query = '';
        this.matches = [];
        this.searched = false;
        this.finishAction(`Aluno matriculado — ${user.name}.`);
      },
      error: () => this.failAction('Não foi possível matricular o aluno. Tente novamente.')
    });
  }

  private finishAction(message: string): void {
    this.actionInFlight = false;
    this.message = message;
    this.reload();
  }

  private failAction(error: string): void {
    this.actionInFlight = false;
    this.error = error;
  }

  private clearFeedback(): void {
    this.message = '';
    this.error = '';
  }
}
