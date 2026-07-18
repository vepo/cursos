import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CategoriesApi } from '../../generated/api/categories.service';
import { CategoryResponse } from '../../generated/model/categoryResponse';

@Component({
  selector: 'app-category-admin',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './category-admin.component.html',
  styleUrl: '../home/home.component.scss'
})
export class CategoryAdminComponent implements OnInit {
  private readonly categoriesApi = inject(CategoriesApi);

  categories: CategoryResponse[] = [];
  categoryName = '';
  categorySlug = '';

  ngOnInit(): void {
    this.loadCategories();
  }

  create(): void {
    this.categoriesApi.createCategory({
      name: this.categoryName,
      slug: this.categorySlug
    }).subscribe(() => {
      this.clearCategoryForm();
      this.loadCategories();
    });
  }

  private loadCategories(): void {
    this.categoriesApi.listCategories().subscribe(categories => this.categories = categories ?? []);
  }

  private clearCategoryForm(): void {
    this.categoryName = '';
    this.categorySlug = '';
  }
}
