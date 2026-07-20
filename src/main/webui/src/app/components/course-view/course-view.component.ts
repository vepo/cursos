import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { CourseImagesApi } from '../../generated/api/courseImages.service';
import { CourseItemsApi } from '../../generated/api/courseItems.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { DiscussionApi } from '../../generated/api/discussion.service';
import { ProgressApi } from '../../generated/api/progress.service';
import { StudyApi } from '../../generated/api/study.service';
import { CommentResponse } from '../../generated/model/commentResponse';
import { CourseDetailResponse } from '../../generated/model/courseDetailResponse';
import { CourseItemResponse } from '../../generated/model/courseItemResponse';
import { StudyItemResponse } from '../../generated/model/studyItemResponse';
import { AuthService } from '../../services/auth.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { extractCourseAssetIds, renderCourseMarkdown } from '../../markdown/course-markdown';

@Component({
  selector: 'app-course-view',
  templateUrl: './course-view.component.html',
  styleUrl: './course-view.component.scss',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ]
})
export class CourseViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coursesApi = inject(CoursesApi);
  private readonly courseItemsApi = inject(CourseItemsApi);
  private readonly courseImagesApi = inject(CourseImagesApi);
  private readonly progressApi = inject(ProgressApi);
  private readonly studyApi = inject(StudyApi);
  private readonly discussionApi = inject(DiscussionApi);
  private readonly authService = inject(AuthService);
  private readonly confirmation = inject(ConfirmationService);

  detail: CourseDetailResponse | null = null;
  courseId = 0;
  aulas: StudyItemResponse[] = [];
  selectedAula: CourseItemResponse | null = null;
  selectedAulaId: number | null = null;
  /** Comments for the selected aula, filtered for the current viewer role. */
  displayedComments: CommentResponse[] = [];
  commentDraft = '';
  commentError = '';
  aulasSidebarOpen = false;
  playbackUrl = '';
  playbackLoading = false;
  playbackError = '';
  markdownHtml = '';
  completedItems = 0;
  totalItems = 0;
  percentComplete = 0;
  courseConcluded = false;
  certificateDownloading = false;
  certificateError = '';
  private markdownUrls = new Map<number, string>();
  private comments: CommentResponse[] = [];
  /** Open-course resume (FQ20–FQ22): pending until study tree and course detail are both loaded. */
  private resumePending = false;
  private studyTreeLoaded = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const courseId = Number(params.get('courseId') ?? params.get('id'));
      const itemId = Number(params.get('itemId')) || null;

      if (courseId !== this.courseId) {
        this.courseId = courseId;
        this.studyTreeLoaded = false;
        this.resumePending = !itemId && !this.openedWithExplicitOverview();
        this.coursesApi.findCourse(courseId).subscribe(detail => {
          this.detail = detail;
          this.syncDisplayedComments();
          this.resumeStudyWhenReady();
        });
        this.loadStudy(itemId);
      } else if (itemId) {
        this.resumePending = false;
        this.selectAula(itemId);
      } else {
        this.resumePending = false;
        this.clearAulaSelection();
      }
    });
  }

  openOverview(): void {
    void this.router.navigate(['/courses', this.courseId], { queryParams: { overview: 1 } });
    this.clearAulaSelection();
  }

  openAula(aula: StudyItemResponse): void {
    if (!aula.id || !aula.accessible) {
      return;
    }
    this.selectAula(aula.id);
    void this.router.navigate(['/courses', this.courseId, 'lessons', aula.id]);
  }

  completeAula(): void {
    if (!this.selectedAulaId) {
      return;
    }
    const completedAulaId = this.selectedAulaId;
    this.progressApi.updateItemProgress(this.courseId, completedAulaId, { completed: true })
      .subscribe({
        next: () => this.loadStudy(completedAulaId, true),
        error: () => {}
      });
  }

  rollbackAula(): void {
    if (!this.selectedAulaId) {
      return;
    }
    const aulaId = this.selectedAulaId;
    this.confirmation.confirm({
      title: 'Desfazer progresso?',
      message: 'Isso limpa esta aula e todas as aulas seguintes. Comentários são preservados.',
      confirmLabel: 'Desfazer progresso',
      cancelLabel: 'Cancelar',
      destructive: true
    }).subscribe(confirmed => {
      if (!confirmed) {
        return;
      }
      this.progressApi.updateItemProgress(this.courseId, aulaId, { completed: false })
        .subscribe({
          next: () => this.loadStudy(aulaId, false),
          error: () => {}
        });
    });
  }

  downloadCertificate(): void {
    this.certificateError = '';
    this.certificateDownloading = true;
    this.progressApi.downloadCourseCertificate(this.courseId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `certificado-curso-${this.courseId}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.certificateDownloading = false;
      },
      error: () => {
        this.certificateDownloading = false;
        this.certificateError = 'Não foi possível baixar o certificado.';
      }
    });
  }

  rollbackFromFinish(): void {
    const lastCompleted = [...this.aulas].reverse().find(aula => !!aula.completed && !!aula.id);
    if (!lastCompleted?.id) {
      return;
    }
    this.selectedAulaId = lastCompleted.id;
    this.rollbackAula();
  }

  isSelectedAulaCompleted(): boolean {
    if (!this.selectedAulaId) {
      return false;
    }
    return this.aulas.some(aula => aula.id === this.selectedAulaId && !!aula.completed);
  }

  progressLabel(): string {
    return `${this.completedItems}/${this.totalItems} (${Math.round(this.percentComplete)}%)`;
  }

  toggleAulasSidebar(): void {
    this.aulasSidebarOpen = !this.aulasSidebarOpen;
  }

  /** Accessible name for the mobile sidebar disclosure control. */
  get aulasSidebarToggleLabel(): string {
    return this.aulasSidebarOpen ? 'Ocultar aulas' : 'Mostrar aulas';
  }

  aulaState(aula: StudyItemResponse): 'completed' | 'current' | 'locked' | 'accessible' {
    if (aula.completed) {
      return 'completed';
    }
    if (aula.id === this.selectedAulaId) {
      return 'current';
    }
    return aula.accessible ? 'accessible' : 'locked';
  }

  aulaStateIcon(aula: StudyItemResponse): string {
    return {
      completed: 'check_circle',
      current: 'play_arrow',
      accessible: 'radio_button_unchecked',
      locked: 'lock'
    }[this.aulaState(aula)];
  }

  renderMarkdown(markdown: string | undefined): string {
    return this.markdownHtml || renderCourseMarkdown(markdown, this.markdownUrls);
  }

  publishComment(): void {
    const content = this.commentDraft.trim();
    if (!content || !this.selectedAulaId) {
      return;
    }
    this.commentError = '';
    this.discussionApi.createComment(this.courseId, this.selectedAulaId, { content }).subscribe({
      next: () => {
        this.commentDraft = '';
        this.refreshComments();
      },
      error: () => {
        this.commentError = 'Não foi possível enviar o comentário.';
      }
    });
  }

  currentUserInitial(): string {
    const name = this.authService.getDisplayName() ?? this.authService.getEmail() ?? '?';
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  teacherInitial(): string {
    const name = this.detail?.course?.teacherName ?? this.detail?.course?.teacherUsername ?? '?';
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  imageResourceUrl(resourceId: number | undefined): string {
    if (!resourceId) {
      return '';
    }
    return `/api/courses/${this.courseId}/resources/${resourceId}`;
  }

  authorInitial(comment: CommentResponse): string {
    const name = comment.authorName || comment.authorUsername || '?';
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  relativeTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const deltaMs = Date.now() - date.getTime();
    const minutes = Math.floor(deltaMs / 60000);
    if (minutes < 1) {
      return 'agora';
    }
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} h`;
    }
    const days = Math.floor(hours / 24);
    return `${days} d`;
  }

  toggleUpvote(comment: CommentResponse): void {
    this.afterCommentMutation(comment, id => this.discussionApi.upvoteComment(id));
  }

  hideComment(comment: CommentResponse): void {
    this.afterCommentMutation(comment, id => this.discussionApi.hideComment(id));
  }

  restoreComment(comment: CommentResponse): void {
    this.afterCommentMutation(comment, id => this.discussionApi.restoreComment(id));
  }

  private loadStudy(requestedItemId: number | null, advanceAfterCompletion = false): void {
    this.studyApi.getCourseStudy(this.courseId).subscribe(study => {
      this.aulas = [...(study.items ?? [])].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
      this.completedItems = study.completedItems ?? 0;
      this.totalItems = study.totalItems ?? this.aulas.length;
      this.percentComplete = study.percentComplete ?? 0;
      this.courseConcluded = !!study.concluded;
      if (advanceAfterCompletion && requestedItemId) {
        const completedIndex = this.aulas.findIndex(aula => aula.id === requestedItemId);
        const next = this.aulas[completedIndex + 1];
        if (next?.id && next.accessible) {
          this.openAula(next);
          return;
        }
      }
      if (requestedItemId) {
        const requested = this.aulas.find(aula => aula.id === requestedItemId && aula.accessible);
        if (requested?.id) {
          this.selectAula(requested.id);
          return;
        }
      }
      this.clearAulaSelection();
      this.studyTreeLoaded = true;
      this.resumeStudyWhenReady();
    });
  }

  private openedWithExplicitOverview(): boolean {
    return this.route.snapshot.queryParamMap?.get('overview') === '1';
  }

  /** FQ20–FQ22: default landing when a student opens the course root — free navigation stays unchanged. */
  private resumeStudyWhenReady(): void {
    if (!this.resumePending || !this.detail || !this.studyTreeLoaded) {
      return;
    }
    this.resumePending = false;
    if (this.detail.teaching || !this.detail.enrolled) {
      return;
    }
    if (this.courseConcluded) {
      const lastCompleted = [...this.aulas].reverse().find(aula => !!aula.completed && !!aula.accessible && !!aula.id);
      if (lastCompleted) {
        this.openAula(lastCompleted);
      }
      return;
    }
    if (this.completedItems > 0) {
      const currentAula = this.aulas.find(aula => !aula.completed && !!aula.accessible && !!aula.id);
      if (currentAula) {
        this.openAula(currentAula);
      }
    }
  }

  private selectAula(itemId: number): void {
    const aula = this.aulas.find(candidate => candidate.id === itemId);
    if (aula && !aula.accessible) {
      return;
    }
    this.selectedAulaId = itemId;
    this.commentDraft = '';
    this.commentError = '';
    this.clearPlayback();
    this.markdownHtml = '';
    this.markdownUrls = new Map();
    this.studyApi.getStudyItem(this.courseId, itemId).subscribe(item => {
      this.selectedAula = item;
      if (item.itemType === 'VIDEO') {
        this.loadPlaybackTicket(itemId);
      }
      if (item.itemType === 'MARKDOWN') {
        this.loadMarkdownImages(item.markdownBody);
      }
    });
    this.loadComments(itemId);
  }

  private clearAulaSelection(): void {
    this.selectedAulaId = null;
    this.selectedAula = null;
    this.commentDraft = '';
    this.commentError = '';
    this.comments = [];
    this.displayedComments = [];
    this.clearPlayback();
    this.markdownHtml = '';
    this.markdownUrls = new Map();
  }

  private loadMarkdownImages(markdown: string | undefined): void {
    const assetIds = extractCourseAssetIds(markdown);
    if (!assetIds.length) {
      this.markdownHtml = renderCourseMarkdown(markdown);
      return;
    }
    this.courseImagesApi.createImageTickets(this.courseId, { assetIds }).subscribe({
      next: response => {
        this.markdownUrls = new Map(
          (response.tickets ?? [])
            .filter(ticket => ticket.assetId != null && ticket.url)
            .map(ticket => [ticket.assetId!, ticket.url!])
        );
        this.markdownHtml = renderCourseMarkdown(markdown, this.markdownUrls);
      },
      error: () => {
        this.markdownHtml = renderCourseMarkdown(markdown);
      }
    });
  }

  private loadPlaybackTicket(itemId: number): void {
    this.playbackLoading = true;
    this.playbackError = '';
    this.playbackUrl = '';
    this.courseItemsApi.createPlaybackTicket(this.courseId, itemId).subscribe({
      next: ticket => {
        this.playbackUrl = ticket.url ?? '';
        this.playbackLoading = false;
        if (!this.playbackUrl) {
          this.playbackError = 'Não foi possível obter o vídeo.';
        }
      },
      error: () => {
        this.playbackLoading = false;
        this.playbackError = 'Não foi possível carregar o vídeo.';
      }
    });
  }

  private clearPlayback(): void {
    this.playbackUrl = '';
    this.playbackLoading = false;
    this.playbackError = '';
  }

  private loadComments(itemId: number): void {
    this.discussionApi.listComments(this.courseId, itemId).subscribe(comments => {
      this.comments = comments ?? [];
      this.syncDisplayedComments();
    });
  }

  private refreshComments(): void {
    if (this.selectedAulaId) {
      this.loadComments(this.selectedAulaId);
    }
  }

  private afterCommentMutation(
    comment: CommentResponse,
    mutate: (commentId: number) => Observable<unknown>
  ): void {
    if (!comment.id) {
      return;
    }
    mutate(comment.id).subscribe(() => this.refreshComments());
  }

  private syncDisplayedComments(): void {
    this.displayedComments = this.detail?.teaching
      ? this.comments
      : this.comments.filter(comment => !comment.hidden);
  }
}
