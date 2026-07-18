import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProgressApi } from '../../generated/api/progress.service';
import { ProgressSummaryResponse } from '../../generated/model/progressSummaryResponse';

@Component({
  selector: 'app-course-progress',
  templateUrl: './course-progress.component.html',
  styleUrl: './course-progress.component.scss',
  imports: [RouterLink, MatToolbarModule, MatButtonModule, DecimalPipe]
})
export class CourseProgressComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly progressApi = inject(ProgressApi);

  courseId = 0;
  summaries: ProgressSummaryResponse[] = [];

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.progressApi.listCourseProgress(this.courseId).subscribe(list => this.summaries = list ?? []);
  }
}
