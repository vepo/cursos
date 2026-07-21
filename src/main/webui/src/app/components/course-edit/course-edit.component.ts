import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AulaBlocksApi } from '../../generated/api/aulaBlocks.service';
import { CategoriesApi } from '../../generated/api/categories.service';
import { CourseImagesApi } from '../../generated/api/courseImages.service';
import { CourseItemsApi } from '../../generated/api/courseItems.service';
import { CoursesApi } from '../../generated/api/courses.service';
import { GitApi } from '../../generated/api/git.service';
import { AulaBlockResponse } from '../../generated/model/aulaBlockResponse';
import { AulaBlockType } from '../../generated/model/aulaBlockType';
import { CategoryResponse } from '../../generated/model/categoryResponse';
import { CourseDetailResponse } from '../../generated/model/courseDetailResponse';
import { CourseGitStatusResponse } from '../../generated/model/courseGitStatusResponse';
import { CourseImageAssetResponse } from '../../generated/model/courseImageAssetResponse';
import { CourseItemResponse } from '../../generated/model/courseItemResponse';
import { ConfirmationService } from '../../services/confirmation.service';
import { DirtyComponent } from '../../services/unsaved-changes.guard';
import { renderCourseMarkdown } from '../../markdown/course-markdown';
import { CourseMermaidDirective } from '../../markdown/course-mermaid.directive';

type EditorSelection = 'details' | 'new-item' | number;
type ShortcutBlockType = Extract<AulaBlockType, 'MARKDOWN' | 'LINK' | 'VIDEO'>;
type AppendBlockType = AulaBlockType;

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
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    CourseMermaidDirective
  ]
})
export class CourseEditComponent implements OnInit, DirtyComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coursesApi = inject(CoursesApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly courseItemsApi = inject(CourseItemsApi);
  private readonly aulaBlocksApi = inject(AulaBlocksApi);
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
  selectedBlockId: number | null = null;
  /** Shortcut type when creating a new aula. */
  itemType: ShortcutBlockType = 'MARKDOWN';
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
  blockReorderPending = false;
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
      this.selectedBlockId = null;
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
      this.selectedBlockId = null;
      this.resetItemForm();
      this.captureSnapshot();
    });
  }

  selectBlock(block: AulaBlockResponse): void {
    if (!block.id || typeof this.selection !== 'number') {
      return;
    }
    this.confirmLeaveSelection().subscribe(ok => {
      if (!ok) {
        return;
      }
      this.applyBlockToForm(block);
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

  selectedAula(): CourseItemResponse | null {
    if (typeof this.selection !== 'number') {
      return null;
    }
    return this.items.find(item => item.id === this.selection) ?? null;
  }

  orderedBlocks(item: CourseItemResponse | null = this.selectedAula()): AulaBlockResponse[] {
    return [...(item?.blocks ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  selectedBlock(): AulaBlockResponse | null {
    if (this.selectedBlockId == null) {
      return null;
    }
    return this.orderedBlocks().find(block => block.id === this.selectedBlockId) ?? null;
  }

  firstBlockType(item: CourseItemResponse): AulaBlockType | undefined {
    return this.orderedBlocks(item)[0]?.blockType;
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

  blockTypeLabel(type: AulaBlockType | undefined): string {
    switch (type) {
      case 'VIDEO':
        return 'Vídeo';
      case 'LINK':
        return 'Link';
      case 'IMAGE':
        return 'Imagem';
      case 'MARKDOWN':
      default:
        return 'Markdown';
    }
  }

  isMarkdownEditor(): boolean {
    if (this.selection === 'new-item') {
      return this.itemType === 'MARKDOWN';
    }
    return this.selectedBlock()?.blockType === 'MARKDOWN';
  }

  isLinkEditor(): boolean {
    if (this.selection === 'new-item') {
      return this.itemType === 'LINK';
    }
    return this.selectedBlock()?.blockType === 'LINK';
  }

  isMediaEditor(): boolean {
    if (this.selection === 'new-item') {
      return this.itemType === 'VIDEO';
    }
    const type = this.selectedBlock()?.blockType;
    return type === 'VIDEO' || type === 'IMAGE';
  }

  canDeleteBlock(block: AulaBlockResponse): boolean {
    return this.orderedBlocks().length > 1 && !!block.id && !this.blockReorderPending;
  }

  canMoveBlockUp(block: AulaBlockResponse): boolean {
    const blocks = this.orderedBlocks();
    const index = blocks.findIndex(candidate => candidate.id === block.id);
    return index > 0 && !this.blockReorderPending;
  }

  canMoveBlockDown(block: AulaBlockResponse): boolean {
    const blocks = this.orderedBlocks();
    const index = blocks.findIndex(candidate => candidate.id === block.id);
    return index >= 0 && index < blocks.length - 1 && !this.blockReorderPending;
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
          this.applyItemToForm(selected, this.selectedBlockId);
        } else {
          this.selection = 'details';
          this.selectedBlockId = null;
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
    this.updateSelectedAula(this.selection);
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
        message: 'Há alterações não salvas no editor atual. Descartar e excluir a aula?',
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

  moveBlock(block: AulaBlockResponse, direction: -1 | 1): void {
    if (!block.id || typeof this.selection !== 'number' || this.blockReorderPending) {
      return;
    }
    if (this.dirty) {
      this.confirmLeaveSelection().subscribe(ok => {
        if (ok) {
          this.performBlockMove(block, direction);
        }
      });
      return;
    }
    this.performBlockMove(block, direction);
  }

  deleteBlock(block: AulaBlockResponse): void {
    if (!block.id || typeof this.selection !== 'number' || !this.canDeleteBlock(block)) {
      return;
    }
    const itemId = this.selection;
    this.confirmation.confirm({
      title: 'Excluir bloco',
      message: `Excluir o bloco ${this.blockTypeLabel(block.blockType)}?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      destructive: true
    }).subscribe(ok => {
      if (!ok || !block.id) {
        return;
      }
      this.aulaBlocksApi.deleteAulaBlock(block.id, this.courseId, itemId).subscribe({
        next: () => {
          if (this.selectedBlockId === block.id) {
            this.selectedBlockId = null;
          }
          this.message = 'Bloco excluído';
          this.load();
        },
        error: () => {
          this.message = 'Não foi possível excluir o bloco.';
        }
      });
    });
  }

  appendBlock(type: AppendBlockType): void {
    if (typeof this.selection !== 'number') {
      return;
    }
    const itemId = this.selection;
    const run = (): void => {
      if (type === 'MARKDOWN') {
        this.aulaBlocksApi.appendMarkdownBlock(this.courseId, itemId, { markdownBody: '' }).subscribe(block => {
          this.afterBlockAppended(block);
        });
        return;
      }
      if (type === 'LINK') {
        this.aulaBlocksApi.appendLinkBlock(this.courseId, itemId, {
          linkUrl: 'https://example.com',
          linkDescription: ''
        }).subscribe(block => {
          this.afterBlockAppended(block);
        });
        return;
      }
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = type === 'VIDEO' ? 'video/*' : 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          return;
        }
        this.aulaBlocksApi.appendMediaBlock(this.courseId, itemId, type, file).subscribe(block => {
          this.afterBlockAppended(block);
        });
      };
      input.click();
    };

    if (this.dirty) {
      this.confirmLeaveSelection().subscribe(ok => {
        if (ok) {
          run();
        }
      });
      return;
    }
    run();
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
    const inBlocks = this.items.some(item =>
      (item.blocks ?? []).some(block => (block.markdownBody ?? '').includes(needle))
    );
    return inBlocks || this.itemBody.includes(needle);
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

  private afterBlockAppended(block: AulaBlockResponse): void {
    this.message = 'Bloco adicionado';
    this.selectedBlockId = block.id ?? null;
    this.captureSnapshot();
    this.load();
  }

  private performBlockMove(block: AulaBlockResponse, direction: -1 | 1): void {
    if (typeof this.selection !== 'number' || !block.id) {
      return;
    }
    const itemId = this.selection;
    const blocks = this.orderedBlocks();
    const index = blocks.findIndex(candidate => candidate.id === block.id);
    const swap = index + direction;
    if (index < 0 || swap < 0 || swap >= blocks.length) {
      return;
    }
    const previous = [...blocks];
    const ordered = [...blocks];
    const [removed] = ordered.splice(index, 1);
    ordered.splice(swap, 0, removed);
    this.blockReorderPending = true;
    const blockIds = ordered.map(entry => entry.id!).filter(Boolean);
    this.aulaBlocksApi.reorderAulaBlocks(this.courseId, itemId, { blockIds }).subscribe({
      next: result => {
        const aula = this.selectedAula();
        if (aula) {
          aula.blocks = result ?? ordered;
        }
        this.blockReorderPending = false;
        this.message = 'Ordem dos blocos atualizada';
        this.applyItemToForm(aula!, this.selectedBlockId);
        this.captureSnapshot();
      },
      error: () => {
        const aula = this.selectedAula();
        if (aula) {
          aula.blocks = previous;
        }
        this.blockReorderPending = false;
        this.message = 'Não foi possível reordenar os blocos.';
      }
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
        this.message = 'Não foi possível reordenar as aulas.';
      }
    });
  }

  private confirmAndDeleteItem(item: CourseItemResponse): void {
    this.confirmation.confirm({
      title: 'Excluir aula',
      message: `Excluir a aula "${item.title}"?`,
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
          this.selectedBlockId = null;
        }
        this.message = 'Aula excluída';
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

  private titleUpdate$(item: CourseItemResponse): Observable<unknown> {
    return this.courseItemsApi.updateCourseItemTitle(this.courseId, item.id!, {
      title: this.itemTitle
    });
  }

  private updateSelectedAula(itemId: number): void {
    const item = this.items.find(candidate => candidate.id === itemId);
    if (!item) {
      return;
    }
    const block = this.selectedBlock();
    // Content first, then title (title helpers may rewrite the first markdown/link block).
    this.blockUpdate$(itemId, block).pipe(
      switchMap(() => this.titleUpdate$(item))
    ).subscribe({
      next: () => this.afterItemUpdated(),
      error: () => {
        this.message = 'Não foi possível salvar a aula.';
      }
    });
  }

  private blockUpdate$(itemId: number, block: AulaBlockResponse | null): Observable<unknown> {
    if (!block?.id) {
      return of(null);
    }
    if (block.blockType === 'MARKDOWN') {
      return this.aulaBlocksApi.updateMarkdownBlock(block.id, this.courseId, itemId, {
        markdownBody: this.itemBody
      });
    }
    if (block.blockType === 'LINK') {
      return this.aulaBlocksApi.updateLinkBlock(block.id, this.courseId, itemId, {
        linkUrl: this.linkUrl,
        linkDescription: this.linkDescription
      });
    }
    return of(null);
  }

  private afterItemSaved(item: CourseItemResponse): void {
    this.message = 'Aula criada';
    this.selection = item.id ?? 'details';
    this.selectedBlockId = this.orderedBlocks(item)[0]?.id ?? null;
    this.captureSnapshot();
    this.load();
  }

  private afterItemUpdated(): void {
    this.message = 'Aula atualizada';
    this.captureSnapshot();
    this.load();
  }

  private applyDetailsToForm(): void {
    this.title = this.detail?.course?.title ?? this.title;
    this.summary = this.detail?.course?.summary ?? this.summary;
    this.categoryIds = (this.detail?.course?.categories ?? []).map(c => c.id!).filter(Boolean);
  }

  private applyItemToForm(item: CourseItemResponse, preferBlockId: number | null = null): void {
    this.itemTitle = item.title ?? '';
    this.mediaFile = null;
    this.mediaFileName = '';
    this.mediaMimeType = '';
    this.mediaFileSize = 0;
    const blocks = this.orderedBlocks(item);
    const preferred = preferBlockId != null
      ? blocks.find(block => block.id === preferBlockId)
      : undefined;
    const block = preferred ?? blocks[0] ?? null;
    if (block) {
      this.applyBlockToForm(block);
    } else {
      this.selectedBlockId = null;
      this.itemBody = '';
      this.linkUrl = '';
      this.linkDescription = '';
    }
  }

  private applyBlockToForm(block: AulaBlockResponse): void {
    this.selectedBlockId = block.id ?? null;
    this.itemBody = block.markdownBody ?? '';
    this.linkUrl = block.linkUrl ?? '';
    this.linkDescription = block.linkDescription ?? '';
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
      selectedBlockId: this.selectedBlockId,
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
