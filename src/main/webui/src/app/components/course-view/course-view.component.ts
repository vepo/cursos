import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { CourseImagesApi } from '../../generated/api/courseImages.service';
import { CourseItemsApi } from '../../generated/api/courseItems.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { DiscussionApi } from '../../generated/api/discussion.service';
import { ProgressApi } from '../../generated/api/progress.service';
import { StudyApi } from '../../generated/api/study.service';
import { AulaBlockResponse } from '../../generated/model/aulaBlockResponse';
import { AulaBlockType } from '../../generated/model/aulaBlockType';
import { CommentResponse } from '../../generated/model/commentResponse';
import { CourseDetailResponse } from '../../generated/model/courseDetailResponse';
import { CourseItemResponse } from '../../generated/model/courseItemResponse';
import { StudyItemResponse } from '../../generated/model/studyItemResponse';
import { AuthService } from '../../services/auth.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { extractCourseAssetIds, renderCourseMarkdown } from '../../markdown/course-markdown';
import { CourseMermaidDirective } from '../../markdown/course-mermaid.directive';

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
    MatInputModule,
    CourseMermaidDirective
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
  /** Playback URL keyed by video block resource id. */
  playbackByResourceId = new Map<number, string>();
  playbackLoading = false;
  playbackError = '';
  markdownHtmlByBlockId = new Map<number, string>();
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

  /** Sidebar icon: lock when locked; otherwise first-block type (FQ6). */
  aulaSidebarIcon(aula: StudyItemResponse): string {
    if (this.aulaState(aula) === 'locked') {
      return 'lock';
    }
    return this.blockTypeIcon(aula.firstBlockType);
  }

  blockTypeIcon(type: AulaBlockType | undefined): string {
    switch (type) {
      case 'VIDEO':
        return 'play_circle';
      case 'LINK':
        return 'link';
      case 'IMAGE':
        return 'image';
      case 'MARKDOWN':
      default:
        return 'article';
    }
  }

  orderedBlocks(item: CourseItemResponse | null = this.selectedAula): AulaBlockResponse[] {
    return [...(item?.blocks ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  renderBlockMarkdown(block: AulaBlockResponse): string {
    if (block.id != null && this.markdownHtmlByBlockId.has(block.id)) {
      return this.markdownHtmlByBlockId.get(block.id)!;
    }
    return renderCourseMarkdown(block.markdownBody, this.markdownUrls);
  }

  playbackUrlFor(block: AulaBlockResponse): string {
    if (!block.resourceId) {
      return '';
    }
    return this.playbackByResourceId.get(block.resourceId) ?? '';
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
    this.markdownHtmlByBlockId = new Map();
    this.markdownUrls = new Map();
    this.studyApi.getStudyItem(this.courseId, itemId).subscribe(item => {
      this.selectedAula = item;
      this.loadBlocksContent(item, itemId);
    });
    this.loadComments(itemId);
  }

  private loadBlocksContent(item: CourseItemResponse, itemId: number): void {
    const blocks = this.orderedBlocks(item);
    const markdownBlocks = blocks.filter(block => block.blockType === 'MARKDOWN');
    const markdownBodies = markdownBlocks.map(block => block.markdownBody ?? '').join('\n');
    this.loadMarkdownImages(markdownBodies, markdownBlocks);

    const videoBlocks = blocks.filter(block => block.blockType === 'VIDEO' && block.resourceId);
    if (videoBlocks.length) {
      this.loadPlaybackTickets(itemId, videoBlocks.map(block => block.resourceId!));
    }
  }

  private clearAulaSelection(): void {
    this.selectedAulaId = null;
    this.selectedAula = null;
    this.commentDraft = '';
    this.commentError = '';
    this.comments = [];
    this.displayedComments = [];
    this.clearPlayback();
    this.markdownHtmlByBlockId = new Map();
    this.markdownUrls = new Map();
  }

  private loadMarkdownImages(combinedMarkdown: string, markdownBlocks: AulaBlockResponse[]): void {
    const assetIds = extractCourseAssetIds(combinedMarkdown);
    const apply = (urls: Map<number, string>): void => {
      this.markdownUrls = urls;
      const next = new Map<number, string>();
      for (const block of markdownBlocks) {
        if (block.id != null) {
          next.set(block.id, renderCourseMarkdown(block.markdownBody, urls));
        }
      }
      this.markdownHtmlByBlockId = next;
    };
    if (!assetIds.length) {
      apply(new Map());
      return;
    }
    this.courseImagesApi.createImageTickets(this.courseId, { assetIds }).subscribe({
      next: response => {
        apply(new Map(
          (response.tickets ?? [])
            .filter(ticket => ticket.assetId != null && ticket.url)
            .map(ticket => [ticket.assetId!, ticket.url!])
        ));
      },
      error: () => apply(new Map())
    });
  }

  private loadPlaybackTickets(itemId: number, resourceIds: number[]): void {
    this.playbackLoading = true;
    this.playbackError = '';
    this.playbackByResourceId = new Map();
    const uniqueIds = [...new Set(resourceIds)];
    forkJoin(
      uniqueIds.map(resourceId =>
        this.courseItemsApi.createPlaybackTicket(this.courseId, itemId, resourceId).pipe(
          map(ticket => ({ resourceId, url: ticket.url ?? '' })),
          catchError(() => of({ resourceId, url: '' }))
        )
      )
    ).subscribe({
      next: tickets => {
        this.playbackLoading = false;
        const next = new Map<number, string>();
        for (const ticket of tickets) {
          if (ticket.url) {
            next.set(ticket.resourceId, ticket.url);
          }
        }
        this.playbackByResourceId = next;
        if (!next.size) {
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
    this.playbackByResourceId = new Map();
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
