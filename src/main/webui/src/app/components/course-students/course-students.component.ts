import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DirectoryApi } from '../../generated/api/directory.service';
import { EnrollmentsApi } from '../../generated/api/enrollments.service';
import { EnrollmentResponse } from '../../generated/model/enrollmentResponse';
import { PassportDirectoryUserResponse } from '../../generated/model/passportDirectoryUserResponse';

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

  courseId = 0;
  enrollments: EnrollmentResponse[] = [];
  query = '';
  matches: PassportDirectoryUserResponse[] = [];

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.reload();
  }

  reload(): void {
    this.enrollmentsApi.listCourseEnrollments(this.courseId).subscribe(list => this.enrollments = list ?? []);
  }

  search(): void {
    this.directoryApi.searchDirectory(0, this.query).subscribe(page => this.matches = page.items ?? []);
  }

  approve(enrollment: EnrollmentResponse): void {
    this.enrollmentsApi.approveEnrollment(enrollment.id!).subscribe(() => this.reload());
  }

  reject(enrollment: EnrollmentResponse): void {
    this.enrollmentsApi.rejectEnrollment(enrollment.id!).subscribe(() => this.reload());
  }

  enroll(user: PassportDirectoryUserResponse): void {
    if (user.id == null || !user.username || !user.name || !user.email) {
      return;
    }
    this.enrollmentsApi.directEnroll(this.courseId, {
      passportUserId: user.id,
      username: user.username,
      name: user.name,
      email: user.email
    }).subscribe(() => {
      this.matches = [];
      this.reload();
    });
  }
}
