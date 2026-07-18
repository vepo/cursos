import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { CatalogApi } from '../../generated/api/catalog.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { CatalogCourseResponse } from '../../generated/model/catalogCourseResponse';

@Component({
  selector: 'app-teacher-home',
  imports: [MatButtonModule, RouterLink],
  templateUrl: './teacher-home.component.html',
  styleUrl: './teacher-home.component.scss'
})
export class TeacherHomeComponent implements OnInit {
  private readonly catalogApi = inject(CatalogApi);
  private readonly coursesApi = inject(CoursesApi);

  teachingCourses: CatalogCourseResponse[] | null = null;
  selectedCourse: CatalogCourseResponse | null = null;
  sidebarOpen = false;
  message = '';

  ngOnInit(): void {
    this.reload();
  }

  selectCourse(course: CatalogCourseResponse): void {
    this.selectedCourse = course;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  statusLabel(course: CatalogCourseResponse): string {
    return course.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho';
  }

  isPublished(course: CatalogCourseResponse): boolean {
    return course.status === 'PUBLISHED';
  }

  publish(course: CatalogCourseResponse): void {
    if (!course.id) {
      return;
    }
    this.coursesApi.publishCourse(course.id).subscribe(() => {
      this.message = 'Curso publicado';
      this.reload(course.id);
    });
  }

  unpublish(course: CatalogCourseResponse): void {
    if (!course.id) {
      return;
    }
    this.coursesApi.unpublishCourse(course.id).subscribe(() => {
      this.message = 'Curso despublicado';
      this.reload(course.id);
    });
  }

  private reload(selectId?: number | null): void {
    this.catalogApi.listCatalog().subscribe(catalog => {
      this.teachingCourses = catalog.teaching ?? [];
      if (selectId) {
        this.selectedCourse = this.teachingCourses.find(course => course.id === selectId) ?? null;
      }
    });
  }
}
