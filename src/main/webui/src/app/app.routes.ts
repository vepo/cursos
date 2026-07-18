import { Routes } from '@angular/router';
import { CourseEditComponent } from './components/course-edit/course-edit.component';
import { CourseProgressComponent } from './components/course-progress/course-progress.component';
import { CourseStudentsComponent } from './components/course-students/course-students.component';
import { CourseViewComponent } from './components/course-view/course-view.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', component: HomeComponent, canActivate: [authGuard] },
  { path: 'courses/new', component: CourseEditComponent, canActivate: [authGuard] },
  { path: 'courses/:id', component: CourseViewComponent, canActivate: [authGuard] },
  { path: 'courses/:id/edit', component: CourseEditComponent, canActivate: [authGuard] },
  { path: 'courses/:id/students', component: CourseStudentsComponent, canActivate: [authGuard] },
  { path: 'courses/:id/progress', component: CourseProgressComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/' }
];
