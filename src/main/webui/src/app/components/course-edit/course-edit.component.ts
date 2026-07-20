import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';

import { CategoriesApi } from '../../generated/api/categories.service';
import { CourseImagesApi } from '../../generated/api/courseImages.service';
import { CourseItemsApi } from '../../generated/api/courseItems.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { GitApi } from '../../generated/api/git.service';
import { CategoryResponse } from '../../generated/model/categoryResponse';
import { CourseDetailResponse } from '../../generated/model/courseDetailResponse';
import { CourseGitStatusResponse } from '../../generated/model/courseGitStatusResponse';
import { CourseImageAssetResponse } from '../../generated/model/courseImageAssetResponse';
import { CourseItemResponse } from '../../generated/model/courseItemResponse';
import { CourseItemType } from '../../generated/model/courseItemType';
import { ConfirmationService } from '../../services/confirmation.service';
import { DirtyComponent } from '../../services/unsaved-changes.guard';
import { renderCourseMarkdown } from '../../markdown/course-markdown';

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
    MatDialogModule,
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
  private readonly courseImagesApi = inject(CourseImagesApi);
  private readonly gitApi = inject(GitApi);
  private readonly confirmation = inject(ConfirmationService);

  @ViewChild('markdownBody')
  private readonly markdownBody?: ElementRef<HTMLTextAreaElement>;

  isNew = false;
  courseId = 0;
  title = '';
  summary = '';
  categoryIds: number[] = [];
  categories: CategoryResponse[] = [];
  detail: CourseDetailResponse | null = null;
  items: CourseItemResponse[] = [];
  gallery: CourseImageAssetResponse[] = [];
  selectedGalleryAssetId: number | null = null;
  galleryAltText = '';
  galleryUploadPending = false;
  galleryError = '';
  coverImageUrl: string | null = null;
  coverImageAssetId: number | null = null;
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
  reorderPending = false;
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

  canDeactivate(): boolean | Observable<boolean> {
    if (!this.dirty) {
      return true;
    }
    return this.confirmation.confirm({
      title: 'Alterações não salvas',
      message: 'Há alterações não salvas. Deseja sair mesmo assim?',
      confirmLabel: 'Sair',
      cancelLabel: 'Continuar editando',
      destructive: true
    });
  }

  markDirty(): void {
    this.dirty = this.computeDirty();
  }

  selectDetails(): void {
    this.confirmLeaveSelection().subscribe(ok => {
      if (!ok) {
        return;
      }
      this.selection = 'details';
      this.applyDetailsToForm();
      this.captureSnapshot();
    });
  }

  selectItem(item: CourseItemResponse): void {
    if (!item.id) {
      return;
    }
    this.confirmLeaveSelection().subscribe(ok => {
      if (!ok) {
        return;
      }
      this.selection = item.id!;
      this.applyItemToForm(item);
      this.captureSnapshot();
    });
  }

  selectNewItem(): void {
    this.confirmLeaveSelection().subscribe(ok => {
      if (!ok) {
        return;
      }
      this.selection = 'new-item';
      this.resetItemForm();
      this.captureSnapshot();
    });
  }

  isSelected(value: EditorSelection): boolean {
    return this.selection === value;
  }

  isPublished(): boolean {
    return this.detail?.course?.status === 'PUBLISHED';
  }

  statusLabel(): string {
    return this.isPublished() ? 'Publicado' : 'Rascunho';
  }

  isExistingLinkItem(): boolean {
    return typeof this.selection === 'number'
      && this.items.find(item => item.id === this.selection)?.itemType === 'LINK';
  }

  isExistingVideoItem(): boolean {
    return typeof this.selection === 'number'
      && this.items.find(item => item.id === this.selection)?.itemType === 'VIDEO';
  }

  isMarkdownEditor(): boolean {
    if (this.selection === 'new-item') {
      return this.itemType === 'MARKDOWN';
    }
    if (typeof this.selection !== 'number') {
      return false;
    }
    return this.items.find(item => item.id === this.selection)?.itemType === 'MARKDOWN';
  }

  previewMarkdownHtml(): string {
    const urls = new Map<number, string>();
    for (const asset of this.gallery) {
      if (asset.id != null && asset.signedUrl) {
        urls.set(asset.id, asset.signedUrl);
      }
    }
    return renderCourseMarkdown(this.itemBody, urls);
  }

  get mediaFileSizeLabel(): string {
    if (!this.mediaFileSize) {
      return '';
    }
    if (this.mediaFileSize < 1024) {
      return `${this.mediaFileSize} B`;
    }
    if (this.mediaFileSize < 1024 * 1024) {
      return `${(this.mediaFileSize / 1024).toFixed(1)} KB`;
    }
    return `${(this.mediaFileSize / (1024 * 1024)).toFixed(1)} MB`;
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

  canMoveUp(item: CourseItemResponse): boolean {
    const index = this.items.findIndex(candidate => candidate.id === item.id);
    return index > 0 && !this.reorderPending;
  }

  canMoveDown(item: CourseItemResponse): boolean {
    const index = this.items.findIndex(candidate => candidate.id === item.id);
    return index >= 0 && index < this.items.length - 1 && !this.reorderPending;
  }

  load(): void {
    this.coursesApi.findCourse(this.courseId).subscribe(detail => {
      this.detail = detail;
      this.items = detail.items ?? [];
      this.applyDetailsToForm();
      this.coverImageAssetId = detail.course?.coverImageAssetId ?? null;
      this.coverImageUrl = detail.course?.coverImageUrl ?? null;
      if (typeof this.selection === 'number') {
        const selected = this.items.find(item => item.id === this.selection);
        if (selected) {
          this.applyItemToForm(selected);
        } else {
          this.selection = 'details';
          this.applyDetailsToForm();
        }
      }
      this.captureSnapshot();
    });
    this.gitApi.getCourseGitStatus(this.courseId).subscribe(status => {
      this.gitStatus = status;
      this.gitUrl = status.remoteUrl ?? this.gitUrl;
      this.gitBranch = status.defaultBranch ?? this.gitBranch;
    });
    this.reloadGallery();
  }

  reloadGallery(): void {
    this.courseImagesApi.listCourseImages(this.courseId).subscribe({
      next: images => {
        this.gallery = images ?? [];
        this.galleryError = '';
      },
      error: () => {
        this.galleryError = 'Não foi possível carregar a galeria.';
      }
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
    if (!item.id || this.reorderPending) {
      return;
    }
    if (this.dirty) {
      this.confirmLeaveSelection().subscribe(ok => {
        if (ok) {
          this.performMove(item, direction);
        }
      });
      return;
    }
    this.performMove(item, direction);
  }

  deleteItem(item: CourseItemResponse): void {
    if (!item.id) {
      return;
    }
    if (this.dirty && this.selection !== item.id) {
      this.confirmation.confirm({
        title: 'Alterações não salvas',
        message: 'Há alterações não salvas no editor atual. Descartar e excluir o item?',
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        destructive: true
      }).subscribe(ok => {
        if (ok) {
          this.confirmAndDeleteItem(item);
        }
      });
      return;
    }
    this.confirmAndDeleteItem(item);
  }

  onCoverFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.courseImagesApi.uploadCourseImage(this.courseId, file).subscribe({
      next: asset => {
        if (!asset.id) {
          return;
        }
        this.courseImagesApi.setCourseCover(this.courseId, asset.id).subscribe(course => {
          this.coverImageAssetId = course.coverImageAssetId ?? asset.id!;
          this.coverImageUrl = course.coverImageUrl ?? asset.signedUrl ?? null;
          this.message = 'Capa atualizada';
          this.reloadGallery();
        });
      },
      error: () => {
        this.message = 'Falha ao enviar a capa.';
      }
    });
    input.value = '';
  }

  setCoverFromGallery(asset: CourseImageAssetResponse): void {
    if (!asset.id) {
      return;
    }
    this.courseImagesApi.setCourseCover(this.courseId, asset.id).subscribe(course => {
      this.coverImageAssetId = course.coverImageAssetId ?? asset.id!;
      this.coverImageUrl = course.coverImageUrl ?? asset.signedUrl ?? null;
      this.message = 'Capa atualizada';
      this.reloadGallery();
    });
  }

  clearCover(): void {
    this.courseImagesApi.clearCourseCover(this.courseId).subscribe(() => {
      this.coverImageAssetId = null;
      this.coverImageUrl = null;
      this.message = 'Capa removida';
      this.reloadGallery();
    });
  }

  onGalleryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.galleryUploadPending = true;
    this.galleryError = '';
    this.courseImagesApi.uploadCourseImage(this.courseId, file).subscribe({
      next: asset => {
        this.galleryUploadPending = false;
        this.reloadGallery();
        this.selectedGalleryAssetId = asset.id ?? null;
        this.message = 'Imagem adicionada à galeria';
      },
      error: () => {
        this.galleryUploadPending = false;
        this.galleryError = 'Falha ao enviar a imagem.';
      }
    });
    input.value = '';
  }

  selectGalleryAsset(asset: CourseImageAssetResponse): void {
    this.selectedGalleryAssetId = asset.id ?? null;
  }

  selectedGalleryAsset(): CourseImageAssetResponse | null {
    if (this.selectedGalleryAssetId == null) {
      return null;
    }
    return this.gallery.find(asset => asset.id === this.selectedGalleryAssetId) ?? null;
  }

  insertSelectedGalleryImage(): void {
    if (!this.selectedGalleryAssetId || !this.isMarkdownEditor()) {
      return;
    }
    const alt = (this.galleryAltText || 'Imagem').trim();
    const snippet = `![${alt}](course-asset:${this.selectedGalleryAssetId})`;
    const textarea = this.markdownBody?.nativeElement;
    if (!textarea) {
      this.itemBody = `${this.itemBody}${this.itemBody ? '\n\n' : ''}${snippet}`;
      this.markDirty();
      return;
    }
    const start = textarea.selectionStart ?? this.itemBody.length;
    const end = textarea.selectionEnd ?? start;
    this.itemBody = `${this.itemBody.slice(0, start)}${snippet}${this.itemBody.slice(end)}`;
    this.markDirty();
    queueMicrotask(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  deleteGalleryAsset(asset: CourseImageAssetResponse): void {
    if (!asset.id) {
      return;
    }
    this.confirmation.confirm({
      title: 'Excluir imagem',
      message: `Excluir "${asset.filename}" da galeria?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      destructive: true
    }).subscribe(ok => {
      if (!ok) {
        return;
      }
      this.courseImagesApi.deleteCourseImage(this.courseId, asset.id!).subscribe({
        next: () => {
          if (this.selectedGalleryAssetId === asset.id) {
            this.selectedGalleryAssetId = null;
          }
          this.message = 'Imagem excluída';
          this.reloadGallery();
        },
        error: err => {
          const status = err?.status;
          this.galleryError = status === 409
            ? 'Não é possível excluir: a imagem é capa ou está referenciada no Markdown.'
            : 'Falha ao excluir a imagem.';
        }
      });
    });
  }

  isAssetReferenced(assetId: number | undefined): boolean {
    if (!assetId) {
      return false;
    }
    const needle = `course-asset:${assetId}`;
    return this.items.some(item => (item.markdownBody ?? '').includes(needle))
      || this.itemBody.includes(needle);
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

  private performMove(item: CourseItemResponse, direction: -1 | 1): void {
    const index = this.items.findIndex(candidate => candidate.id === item.id);
    const swap = index + direction;
    if (index < 0 || swap < 0 || swap >= this.items.length) {
      return;
    }
    const previous = [...this.items];
    const ordered = [...this.items];
    const [removed] = ordered.splice(index, 1);
    ordered.splice(swap, 0, removed);
    this.items = ordered;
    this.reorderPending = true;
    const itemIds = ordered.map(entry => entry.id!).filter(Boolean);
    this.courseItemsApi.reorderCourseItems(this.courseId, { itemIds }).subscribe({
      next: items => {
        this.items = items ?? ordered;
        this.reorderPending = false;
        this.message = 'Ordem atualizada';
      },
      error: () => {
        this.items = previous;
        this.reorderPending = false;
        this.message = 'Não foi possível reordenar os itens.';
      }
    });
  }

  private confirmAndDeleteItem(item: CourseItemResponse): void {
    this.confirmation.confirm({
      title: 'Excluir item',
      message: `Excluir o item "${item.title}"?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      destructive: true
    }).subscribe(ok => {
      if (!ok || !item.id) {
        return;
      }
      this.courseItemsApi.deleteCourseItem(this.courseId, item.id).subscribe(() => {
        if (this.selection === item.id) {
          this.selection = 'details';
        }
        this.message = 'Item excluído';
        this.load();
      });
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

  private confirmLeaveSelection(): Observable<boolean> {
    return this.confirmation.confirmOrTrue(this.dirty, {
      title: 'Alterações não salvas',
      message: 'Há alterações não salvas. Descartar e continuar?',
      confirmLabel: 'Descartar',
      cancelLabel: 'Continuar editando',
      destructive: true
    });
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
