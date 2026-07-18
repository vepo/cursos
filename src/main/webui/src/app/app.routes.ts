import { Routes } from '@angular/router';
import { AccountComponent } from './components/account/account.component';
import { CategoryAdminComponent } from './components/category-admin/category-admin.component';
import { CourseEditComponent } from './components/course-edit/course-edit.component';
import { CourseProgressComponent } from './components/course-progress/course-progress.component';
import { CourseStudentsComponent } from './components/course-students/course-students.component';
import { CourseViewComponent } from './components/course-view/course-view.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { TeacherHomeComponent } from './components/teacher-home/teacher-home.component';
import { authGuard } from './services/auth.guard';
import { unsavedChangesGuard } from './services/unsaved-changes.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'account', component: AccountComponent, canActivate: [authGuard] },
  { path: 'courses/:id', component: CourseViewComponent, canActivate: [authGuard] },
  { path: 'courses/:id/lessons/:itemId', component: CourseViewComponent, canActivate: [authGuard] },
  { path: 'admin/categories', component: CategoryAdminComponent, canActivate: [authGuard] },
  {
    path: 'teacher',
    canActivate: [authGuard],
    children: [
      { path: '', component: TeacherHomeComponent },
      { path: 'courses/new', component: CourseEditComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'courses/:id/edit', component: CourseEditComponent, canDeactivate: [unsavedChangesGuard] },
      { path: 'courses/:id/students', component: CourseStudentsComponent },
      { path: 'courses/:id/progress', component: CourseProgressComponent }
    ]
  },
  { path: '**', redirectTo: '/' }
];
