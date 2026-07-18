import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CatalogApi } from '../../generated/api/catalog.service';
import { CategoriesApi } from '../../generated/api/categories.service';
import { EnrollmentsApi } from '../../generated/api/enrollments.service';
import { CatalogCourseResponse } from '../../generated/model/catalogCourseResponse';
import { CatalogResponse } from '../../generated/model/catalogResponse';
import { CategoryResponse } from '../../generated/model/categoryResponse';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule
  ]
})
export class HomeComponent implements OnInit {
  private readonly catalogApi = inject(CatalogApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly enrollmentsApi = inject(EnrollmentsApi);
  readonly auth = inject(AuthService);

  catalog: CatalogResponse | null = null;
  categories: CategoryResponse[] = [];
  selectedCategory = '';

  ngOnInit(): void {
    this.categoriesApi.listCategories().subscribe(categories => this.categories = categories ?? []);
    this.reload();
  }

  reload(): void {
    this.catalogApi.listCatalog(this.selectedCategory || undefined).subscribe(catalog => this.catalog = catalog);
  }

  requestEnrollment(course: CatalogCourseResponse): void {
    if (!course.id) {
      return;
    }
    this.enrollmentsApi.requestEnrollment(course.id).subscribe(() => this.reload());
  }

  logout(): void {
    this.auth.logout();
    location.href = '/login';
  }
}
