import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CoursesApi } from '../../generated/api/courses.service';
import { ProgressApi } from '../../generated/api/progress.service';
import { CourseDetailResponse } from '../../generated/model/courseDetailResponse';
import { CourseItemResponse } from '../../generated/model/courseItemResponse';

@Component({
  selector: 'app-course-view',
  templateUrl: './course-view.component.html',
  styleUrl: './course-view.component.scss',
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatCheckboxModule]
})
export class CourseViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly coursesApi = inject(CoursesApi);
  private readonly progressApi = inject(ProgressApi);

  detail: CourseDetailResponse | null = null;
  courseId = 0;
  completed = new Set<number>();

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.coursesApi.findCourse(this.courseId).subscribe(detail => this.detail = detail);
  }

  toggle(item: CourseItemResponse, completed: boolean): void {
    if (!item.id) {
      return;
    }
    this.progressApi.updateItemProgress(this.courseId, item.id, { completed }).subscribe(() => {
      if (completed) {
        this.completed.add(item.id!);
      } else {
        this.completed.delete(item.id!);
      }
    });
  }

  isCompleted(item: CourseItemResponse): boolean {
    return !!item.id && this.completed.has(item.id);
  }
}
