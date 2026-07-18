import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CategoriesApi } from '../../generated/api/categories.service';
import { CourseItemsApi } from '../../generated/api/courseItems.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { GitApi } from '../../generated/api/git.service';
import { CategoryResponse } from '../../generated/model/categoryResponse';
import { CourseDetailResponse } from '../../generated/model/courseDetailResponse';
import { CourseGitStatusResponse } from '../../generated/model/courseGitStatusResponse';

@Component({
  selector: 'app-course-edit',
  templateUrl: './course-edit.component.html',
  styleUrl: './course-edit.component.scss',
  imports: [
    FormsModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ]
})
export class CourseEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coursesApi = inject(CoursesApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly courseItemsApi = inject(CourseItemsApi);
  private readonly gitApi = inject(GitApi);

  isNew = false;
  courseId = 0;
  title = '';
  summary = '';
  categoryIds: number[] = [];
  categories: CategoryResponse[] = [];
  detail: CourseDetailResponse | null = null;
  markdownTitle = '';
  markdownBody = '';
  gitUrl = '';
  gitBranch = 'main';
  gitStatus: CourseGitStatusResponse | null = null;
  message = '';

  ngOnInit(): void {
    this.categoriesApi.listCategories().subscribe(categories => this.categories = categories ?? []);
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = !idParam || idParam === 'new';
    if (!this.isNew) {
      this.courseId = Number(idParam);
      this.load();
    }
  }

  load(): void {
    this.coursesApi.findCourse(this.courseId).subscribe(detail => {
      this.detail = detail;
      this.title = detail.course?.title ?? '';
      this.summary = detail.course?.summary ?? '';
      this.categoryIds = (detail.course?.categories ?? []).map(c => c.id!).filter(Boolean);
    });
    this.gitApi.getCourseGitStatus(this.courseId).subscribe({
      next: status => {
        this.gitStatus = status;
        this.gitUrl = status.remoteUrl ?? '';
        this.gitBranch = status.defaultBranch ?? 'main';
      },
      error: () => this.gitStatus = null
    });
  }

  save(): void {
    const body = { title: this.title, summary: this.summary, categoryIds: this.categoryIds };
    if (this.isNew) {
      this.coursesApi.createCourse(body).subscribe(course => {
        void this.router.navigate(['/courses', course.id, 'edit']);
      });
      return;
    }
    this.coursesApi.updateCourse(this.courseId, body).subscribe(() => {
      this.message = 'Curso atualizado';
      this.load();
    });
  }

  publish(): void {
    this.coursesApi.publishCourse(this.courseId).subscribe(() => {
      this.message = 'Curso publicado';
      this.load();
    });
  }

  addMarkdown(): void {
    this.courseItemsApi.createMarkdownItem(this.courseId, {
      title: this.markdownTitle,
      markdownBody: this.markdownBody
    }).subscribe(() => {
      this.markdownTitle = '';
      this.markdownBody = '';
      this.load();
    });
  }

  linkGit(): void {
    this.gitApi.linkCourseGit(this.courseId, {
      remoteUrl: this.gitUrl,
      defaultBranch: this.gitBranch,
      descriptionPath: 'course.yml'
    }).subscribe(status => {
      this.gitStatus = status;
      this.message = 'Repositório vinculado';
    });
  }

  syncGit(): void {
    this.gitApi.syncCourseGit(this.courseId).subscribe(status => {
      this.gitStatus = status;
      this.message = 'Sincronização concluída';
      this.load();
    });
  }
}
