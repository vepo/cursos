import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CoursesApi } from '../../generated/api/courses.service';
import { ProgressApi } from '../../generated/api/progress.service';
import { CourseItemResponse } from '../../generated/model/courseItemResponse';
import { ProgressSummaryResponse } from '../../generated/model/progressSummaryResponse';
import { ConfirmationService } from '../../services/confirmation.service';

export interface AulaChecklistRow {
  courseItemId: number;
  title: string;
  sortOrder: number;
  completed: boolean;
}

@Component({
  selector: 'app-course-progress',
  templateUrl: './course-progress.component.html',
  styleUrl: './course-progress.component.scss',
  imports: [RouterLink, MatButtonModule, DecimalPipe, DatePipe]
})
export class CourseProgressComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly progressApi = inject(ProgressApi);
  private readonly coursesApi = inject(CoursesApi);
  private readonly confirmation = inject(ConfirmationService);

  courseId = 0;
  courseTitle = '';
  courseItems: CourseItemResponse[] = [];
  summaries: ProgressSummaryResponse[] = [];
  expandedEnrollmentIds = new Set<number>();
  message = '';
  error = '';
  actionInFlight = false;

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.coursesApi.findCourse(this.courseId).subscribe(detail => {
      this.courseTitle = detail.course?.title ?? '';
      this.courseItems = [...(detail.items ?? [])].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );
    });
    this.reload();
  }

  get sortedSummaries(): ProgressSummaryResponse[] {
    return [...this.summaries].sort((a, b) => {
      const percentDiff = (a.percentComplete ?? 0) - (b.percentComplete ?? 0);
      if (percentDiff !== 0) {
        return percentDiff;
      }
      return (a.studentName ?? '').localeCompare(b.studentName ?? '', 'pt-BR');
    });
  }

  get studentCount(): number {
    return this.summaries.length;
  }

  get averagePercent(): number {
    if (this.summaries.length === 0) {
      return 0;
    }
    const sum = this.summaries.reduce((acc, s) => acc + (s.percentComplete ?? 0), 0);
    return Math.round((sum / this.summaries.length) * 10) / 10;
  }

  get concludedCount(): number {
    return this.summaries.filter(
      s => (s.totalItems ?? 0) > 0 && (s.completedItems ?? 0) === (s.totalItems ?? 0)
    ).length;
  }

  isExpanded(enrollmentId: number | undefined): boolean {
    return enrollmentId != null && this.expandedEnrollmentIds.has(enrollmentId);
  }

  toggleExpand(summary: ProgressSummaryResponse): void {
    const id = summary.enrollmentId;
    if (id == null) {
      return;
    }
    if (this.expandedEnrollmentIds.has(id)) {
      this.expandedEnrollmentIds.delete(id);
    } else {
      this.expandedEnrollmentIds.add(id);
    }
  }

  isConcluded(summary: ProgressSummaryResponse): boolean {
    return (summary.totalItems ?? 0) > 0
      && (summary.completedItems ?? 0) === (summary.totalItems ?? 0);
  }

  lastActivity(summary: ProgressSummaryResponse): string | null {
    const dates = (summary.items ?? [])
      .map(item => item.updatedAt)
      .filter((value): value is string => !!value);
    if (dates.length === 0) {
      return null;
    }
    return dates.reduce((latest, current) =>
      new Date(current).getTime() > new Date(latest).getTime() ? current : latest
    );
  }

  aulasFor(summary: ProgressSummaryResponse): AulaChecklistRow[] {
    const progressByItem = new Map(
      (summary.items ?? []).map(item => [item.courseItemId, item])
    );
    return this.courseItems
      .filter(item => item.id != null)
      .map(item => {
        const progress = progressByItem.get(item.id!);
        return {
          courseItemId: item.id!,
          title: item.title ?? '',
          sortOrder: item.sortOrder ?? 0,
          completed: !!progress?.completed
        };
      });
  }

  markComplete(summary: ProgressSummaryResponse, aula: AulaChecklistRow): void {
    this.applyAdjust(summary, aula, true, `Aula marcada como concluída para ${summary.studentName}.`);
  }

  undoComplete(summary: ProgressSummaryResponse, aula: AulaChecklistRow): void {
    this.confirmation.confirm({
      title: 'Desfazer progresso',
      message: `Desfazer a aula "${aula.title}" de ${summary.studentName}? Esta e todas as aulas posteriores serão desmarcadas.`,
      confirmLabel: 'Desfazer',
      cancelLabel: 'Cancelar',
      destructive: true
    }).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.applyAdjust(
        summary,
        aula,
        false,
        `Progresso desfeito para ${summary.studentName}.`
      );
    });
  }

  reload(): void {
    this.progressApi.listCourseProgress(this.courseId).subscribe(list => this.summaries = list ?? []);
  }

  private applyAdjust(
    summary: ProgressSummaryResponse,
    aula: AulaChecklistRow,
    completed: boolean,
    successMessage: string
  ): void {
    if (summary.studentPassportUserId == null) {
      return;
    }
    this.clearFeedback();
    this.actionInFlight = true;
    this.progressApi.updateItemProgress(this.courseId, aula.courseItemId, {
      completed,
      studentPassportUserId: summary.studentPassportUserId
    }).subscribe({
      next: () => this.finishAction(successMessage),
      error: () => this.failAction('Não foi possível atualizar o progresso. Tente novamente.')
    });
  }

  private finishAction(message: string): void {
    this.actionInFlight = false;
    this.message = message;
    this.reload();
  }

  private failAction(error: string): void {
    this.actionInFlight = false;
    this.error = error;
  }

  private clearFeedback(): void {
    this.message = '';
    this.error = '';
  }
}
