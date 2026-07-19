import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { CatalogApi } from '../../generated/api/catalog.service';
import { CategoriesApi } from '../../generated/api/categories.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { EnrollmentsApi } from '../../generated/api/enrollments.service';
import { CatalogCourseResponse } from '../../generated/model/catalogCourseResponse';
import { CatalogResponse } from '../../generated/model/catalogResponse';
import { CategoryResponse } from '../../generated/model/categoryResponse';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    RouterLink,
    MatChipsModule,
    DecimalPipe
  ]
})
export class HomeComponent implements OnInit {
  private readonly catalogApi = inject(CatalogApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly coursesApi = inject(CoursesApi);
  private readonly enrollmentsApi = inject(EnrollmentsApi);

  catalog: CatalogResponse | null = null;
  categories: CategoryResponse[] = [];
  selectedCategory = '';
  sidebarOpen = true;

  ngOnInit(): void {
    this.categoriesApi.listCategories().subscribe(categories => this.categories = categories ?? []);
    this.reload();
  }

  get categoryFilterToggleLabel(): string {
    return this.sidebarOpen ? 'Ocultar categorias' : 'Mostrar categorias';
  }

  isCategorySelected(slug: string): boolean {
    return this.selectedCategory === slug;
  }

  selectCategory(slug: string | undefined): void {
    this.selectedCategory = slug ?? '';
    this.reload();
  }

  reload(): void {
    this.catalogApi.listCatalog(this.selectedCategory || undefined).subscribe(catalog => {
      this.catalog = catalog;
    });
  }

  requestEnrollment(course: CatalogCourseResponse): void {
    if (!course.id) {
      return;
    }
    this.enrollmentsApi.requestEnrollment(course.id).subscribe(() => this.reload());
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  statusLabel(course: CatalogCourseResponse): string {
    return course.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho';
  }

  enrollmentLabel(course: CatalogCourseResponse): string {
    switch (course.enrollmentStatus) {
      case 'ENROLLED':
        return 'Matriculado';
      case 'REQUESTED':
        return 'Solicitado';
      case 'REJECTED':
        return 'Recusado';
      default:
        return course.enrollmentStatus ?? '';
    }
  }

  isPublished(course: CatalogCourseResponse): boolean {
    return course.status === 'PUBLISHED';
  }

  publishCourse(course: CatalogCourseResponse): void {
    if (!course.id) {
      return;
    }
    this.coursesApi.publishCourse(course.id).subscribe(() => this.reload());
  }

  unpublishCourse(course: CatalogCourseResponse): void {
    if (!course.id) {
      return;
    }
    this.coursesApi.unpublishCourse(course.id).subscribe(() => this.reload());
  }
}
