import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
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
import { renderCourseMarkdown } from './course-markdown.renderer';

@Component({
  selector: 'app-course-view',
  templateUrl: './course-view.component.html',
  styleUrl: './course-view.component.scss',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class CourseViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coursesApi = inject(CoursesApi);
  private readonly courseItemsApi = inject(CourseItemsApi);
  private readonly progressApi = inject(ProgressApi);
  private readonly studyApi = inject(StudyApi);
  private readonly discussionApi = inject(DiscussionApi);
  private readonly authService = inject(AuthService);

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

  private comments: CommentResponse[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const courseId = Number(params.get('courseId') ?? params.get('id'));
      const itemId = Number(params.get('itemId')) || null;

      if (courseId !== this.courseId) {
        this.courseId = courseId;
        this.coursesApi.findCourse(courseId).subscribe(detail => {
          this.detail = detail;
          this.syncDisplayedComments();
        });
        this.loadStudy(itemId);
      } else if (itemId) {
        this.selectAula(itemId);
      }
    });
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
    this.progressApi.updateItemProgress(this.courseId, this.selectedAulaId, { completed: true })
      .subscribe(() => this.loadStudy(this.selectedAulaId));
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

  renderMarkdown(markdown: string | undefined): string {
    return renderCourseMarkdown(markdown);
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

  private loadStudy(requestedItemId: number | null): void {
    this.studyApi.getCourseStudy(this.courseId).subscribe(study => {
      this.aulas = [...(study.items ?? [])].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
      const requested = requestedItemId
        ? this.aulas.find(aula => aula.id === requestedItemId && aula.accessible)
        : undefined;
      const firstAccessible = this.aulas.find(aula => aula.accessible && !aula.completed)
        ?? this.aulas.find(aula => aula.accessible);
      const selected = requested ?? firstAccessible;

      if (selected?.id) {
        this.selectAula(selected.id);
      }
    });
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
    this.studyApi.getStudyItem(this.courseId, itemId).subscribe(item => {
      this.selectedAula = item;
      if (item.itemType === 'VIDEO') {
        this.loadPlaybackTicket(itemId);
      }
    });
    this.loadComments(itemId);
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
