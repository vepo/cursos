import { Component, HostListener, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CategoriesApi } from '../../generated/api/categories.service';
import { CourseItemsApi } from '../../generated/api/courseItems.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { GitApi } from '../../generated/api/git.service';
import { CategoryResponse } from '../../generated/model/categoryResponse';
import { CourseDetailResponse } from '../../generated/model/courseDetailResponse';
import { CourseGitStatusResponse } from '../../generated/model/courseGitStatusResponse';
import { CourseItemResponse } from '../../generated/model/courseItemResponse';
import { CourseItemType } from '../../generated/model/courseItemType';
import { DirtyComponent } from '../../services/unsaved-changes.guard';

type EditorSelection = 'details' | 'new-item' | number;
type ItemEditorType = Extract<CourseItemType, 'MARKDOWN' | 'LINK' | 'VIDEO'>;

@Component({
  selector: 'app-course-edit',
  templateUrl: './course-edit.component.html',
  styleUrl: './course-edit.component.scss',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ]
})
export class CourseEditComponent implements OnInit, DirtyComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coursesApi = inject(CoursesApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly courseItemsApi = inject(CourseItemsApi);
  private readonly gitApi = inject(GitApi);

  isNew = false;
  courseId = 0;
  title = '';
  summary = '';
  categoryIds: number[] = [];
  categories: CategoryResponse[] = [];
  detail: CourseDetailResponse | null = null;
  items: CourseItemResponse[] = [];
  selection: EditorSelection = 'details';
  itemType: ItemEditorType = 'MARKDOWN';
  itemTitle = '';
  itemBody = '';
  linkUrl = '';
  linkDescription = '';
  mediaFile: File | null = null;
  mediaFileName = '';
  mediaMimeType = '';
  mediaFileSize = 0;
  gitUrl = '';
  gitBranch = 'main';
  gitStatus: CourseGitStatusResponse | null = null;
  message = '';
  dirty = false;
  private savedSnapshot = '';

  ngOnInit(): void {
    this.categoriesApi.listCategories().subscribe(categories => this.categories = categories ?? []);
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = !idParam || idParam === 'new';
    if (!this.isNew) {
      this.courseId = Number(idParam);
      this.load();
    } else {
      this.captureSnapshot();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  canDeactivate(): boolean {
    if (!this.dirty) {
      return true;
    }
    return window.confirm('Há alterações não salvas. Deseja sair mesmo assim?');
  }

  markDirty(): void {
    this.dirty = this.computeDirty();
  }

  selectDetails(): void {
    if (!this.confirmLeaveSelection()) {
      return;
    }
    this.selection = 'details';
    this.applyDetailsToForm();
    this.captureSnapshot();
  }

  selectItem(item: CourseItemResponse): void {
    if (!item.id || !this.confirmLeaveSelection()) {
      return;
    }
    this.selection = item.id;
    this.applyItemToForm(item);
    this.captureSnapshot();
  }

  selectNewItem(): void {
    if (!this.confirmLeaveSelection()) {
      return;
    }
    this.selection = 'new-item';
    this.resetItemForm();
    this.captureSnapshot();
  }

  isSelected(target: EditorSelection): boolean {
    return this.selection === target;
  }

  isExistingVideoItem(): boolean {
    return typeof this.selection === 'number'
      && this.items.find(item => item.id === this.selection)?.itemType === 'VIDEO';
  }

  isExistingLinkItem(): boolean {
    return typeof this.selection === 'number'
      && this.items.find(item => item.id === this.selection)?.itemType === 'LINK';
  }

  isExistingMarkdownItem(): boolean {
    return typeof this.selection === 'number'
      && this.items.find(item => item.id === this.selection)?.itemType === 'MARKDOWN';
  }

  statusLabel(): string {
    const status = this.detail?.course?.status;
    return status === 'PUBLISHED' ? 'Publicado' : 'Rascunho';
  }

  isPublished(): boolean {
    return this.detail?.course?.status === 'PUBLISHED';
  }

  onMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.mediaFile = file;
    this.mediaFileName = file?.name ?? '';
    this.mediaMimeType = file?.type ?? '';
    this.mediaFileSize = file?.size ?? 0;
    this.markDirty();
  }

  get mediaFileSizeLabel(): string {
    if (this.mediaFileSize <= 0) {
      return '0 B';
    }
    const units = ['B', 'KiB', 'MiB', 'GiB'];
    let size = this.mediaFileSize;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    const rounded = unit === 0 ? `${Math.round(size)}` : size.toFixed(1);
    return `${rounded} ${units[unit]}`;
  }

  load(): void {
    this.coursesApi.findCourse(this.courseId).subscribe(detail => {
      this.detail = detail;
      this.items = [...(detail.items ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      if (this.selection === 'details' || this.isNew) {
        this.applyDetailsToForm();
      } else if (typeof this.selection === 'number') {
        const item = this.items.find(candidate => candidate.id === this.selection);
        if (item) {
          this.applyItemToForm(item);
        } else {
          this.selection = 'details';
          this.applyDetailsToForm();
        }
      }
      this.captureSnapshot();
    });
    this.gitApi.getCourseGitStatus(this.courseId).subscribe({
      next: status => {
        this.gitStatus = status;
        this.gitUrl = status.remoteUrl ?? '';
        this.gitBranch = status.defaultBranch ?? 'main';
      },
      error: () => this.gitStatus = null
    });
  }

  save(): void {
    if (this.selection === 'details' || this.isNew) {
      this.saveDetails();
      return;
    }
    if (this.selection === 'new-item') {
      this.createItem();
      return;
    }
    this.updateItem(this.selection);
  }

  publish(): void {
    this.coursesApi.publishCourse(this.courseId).subscribe(() => {
      this.message = 'Curso publicado';
      this.load();
    });
  }

  unpublish(): void {
    this.coursesApi.unpublishCourse(this.courseId).subscribe(() => {
      this.message = 'Curso despublicado';
      this.load();
    });
  }

  moveItem(item: CourseItemResponse, direction: -1 | 1): void {
    if (!item.id || this.dirty && !this.confirmLeaveSelection()) {
      return;
    }
    const index = this.items.findIndex(candidate => candidate.id === item.id);
    const swap = index + direction;
    if (index < 0 || swap < 0 || swap >= this.items.length) {
      return;
    }
    const ordered = [...this.items];
    const [removed] = ordered.splice(index, 1);
    ordered.splice(swap, 0, removed);
    const itemIds = ordered.map(entry => entry.id!).filter(Boolean);
    this.courseItemsApi.reorderCourseItems(this.courseId, { itemIds }).subscribe(items => {
      this.items = items ?? ordered;
      this.message = 'Ordem atualizada';
    });
  }

  deleteItem(item: CourseItemResponse): void {
    if (!item.id) {
      return;
    }
    if (!window.confirm(`Excluir o item "${item.title}"?`)) {
      return;
    }
    this.courseItemsApi.deleteCourseItem(this.courseId, item.id).subscribe(() => {
      if (this.selection === item.id) {
        this.selection = 'details';
      }
      this.message = 'Item excluído';
      this.load();
    });
  }

  linkGit(): void {
    this.gitApi.linkCourseGit(this.courseId, {
      remoteUrl: this.gitUrl,
      defaultBranch: this.gitBranch,
      descriptionPath: 'course.yml'
    }).subscribe(status => {
      this.gitStatus = status;
      this.message = 'Repositório vinculado';
    });
  }

  syncGit(): void {
    this.gitApi.syncCourseGit(this.courseId).subscribe(status => {
      this.gitStatus = status;
      this.message = 'Sincronização concluída';
      this.load();
    });
  }

  private saveDetails(): void {
    const body = { title: this.title, summary: this.summary, categoryIds: this.categoryIds };
    if (this.isNew) {
      this.coursesApi.createCourse(body).subscribe(course => {
        this.dirty = false;
        void this.router.navigate(['/teacher/courses', course.id, 'edit']);
      });
      return;
    }
    this.coursesApi.updateCourse(this.courseId, body).subscribe(() => {
      this.message = 'Curso atualizado';
      this.captureSnapshot();
      this.load();
    });
  }

  private createItem(): void {
    if (this.itemType === 'MARKDOWN') {
      this.courseItemsApi.createMarkdownItem(this.courseId, {
        title: this.itemTitle,
        markdownBody: this.itemBody
      }).subscribe(item => this.afterItemSaved(item));
      return;
    }
    if (this.itemType === 'LINK') {
      this.courseItemsApi.createLinkItem(this.courseId, {
        title: this.itemTitle,
        linkUrl: this.linkUrl,
        linkDescription: this.linkDescription
      }).subscribe(item => this.afterItemSaved(item));
      return;
    }
    this.courseItemsApi.uploadMediaItem(
      this.courseId,
      this.itemTitle,
      'VIDEO',
      this.mediaFile ?? undefined
    ).subscribe(item => this.afterItemSaved(item));
  }

  private updateItem(itemId: number): void {
    const item = this.items.find(candidate => candidate.id === itemId);
    if (!item) {
      return;
    }
    if (item.itemType === 'MARKDOWN') {
      this.courseItemsApi.updateMarkdownItem(this.courseId, itemId, {
        title: this.itemTitle,
        markdownBody: this.itemBody
      }).subscribe(() => this.afterItemUpdated());
      return;
    }
    if (item.itemType === 'LINK') {
      this.courseItemsApi.updateLinkItem(this.courseId, itemId, {
        title: this.itemTitle,
        linkUrl: this.linkUrl,
        linkDescription: this.linkDescription
      }).subscribe(() => this.afterItemUpdated());
    }
  }

  private afterItemSaved(item: CourseItemResponse): void {
    this.message = 'Item criado';
    this.selection = item.id ?? 'details';
    this.captureSnapshot();
    this.load();
  }

  private afterItemUpdated(): void {
    this.message = 'Item atualizado';
    this.captureSnapshot();
    this.load();
  }

  private applyDetailsToForm(): void {
    this.title = this.detail?.course?.title ?? this.title;
    this.summary = this.detail?.course?.summary ?? this.summary;
    this.categoryIds = (this.detail?.course?.categories ?? []).map(c => c.id!).filter(Boolean);
  }

  private applyItemToForm(item: CourseItemResponse): void {
    this.itemType = item.itemType === 'LINK' || item.itemType === 'VIDEO' ? item.itemType : 'MARKDOWN';
    this.itemTitle = item.title ?? '';
    this.itemBody = item.markdownBody ?? '';
    this.linkUrl = item.linkUrl ?? '';
    this.linkDescription = item.linkDescription ?? '';
    this.mediaFile = null;
    this.mediaFileName = '';
    this.mediaMimeType = '';
    this.mediaFileSize = 0;
  }

  private resetItemForm(): void {
    this.itemType = 'MARKDOWN';
    this.itemTitle = '';
    this.itemBody = '';
    this.linkUrl = '';
    this.linkDescription = '';
    this.mediaFile = null;
    this.mediaFileName = '';
    this.mediaMimeType = '';
    this.mediaFileSize = 0;
  }

  private confirmLeaveSelection(): boolean {
    if (!this.dirty) {
      return true;
    }
    return window.confirm('Há alterações não salvas. Descartar e continuar?');
  }

  private captureSnapshot(): void {
    this.savedSnapshot = this.snapshot();
    this.dirty = false;
  }

  private computeDirty(): boolean {
    return this.snapshot() !== this.savedSnapshot;
  }

  private snapshot(): string {
    if (this.selection === 'details' || this.isNew) {
      return JSON.stringify({
        kind: 'details',
        title: this.title,
        summary: this.summary,
        categoryIds: this.categoryIds,
        gitUrl: this.gitUrl,
        gitBranch: this.gitBranch
      });
    }
    return JSON.stringify({
      kind: 'item',
      selection: this.selection,
      itemType: this.itemType,
      itemTitle: this.itemTitle,
      itemBody: this.itemBody,
      linkUrl: this.linkUrl,
      linkDescription: this.linkDescription,
      mediaFileName: this.mediaFileName,
      mediaMimeType: this.mediaMimeType,
      mediaFileSize: this.mediaFileSize
    });
  }
}
