import { AfterViewChecked, Directive, ElementRef, inject } from '@angular/core';

import { hydrateCourseMermaid, pendingMermaidNodes } from '../markdown/course-mermaid';

/**
 * After sanitized markdown HTML is bound, hydrate any pending Mermaid placeholders.
 */
@Directive({
  selector: '[appCourseMermaid]',
  standalone: true
})
export class CourseMermaidDirective implements AfterViewChecked {
  private readonly host = inject(ElementRef<HTMLElement>);
  private hydrating = false;

  ngAfterViewChecked(): void {
    const root = this.host.nativeElement;
    if (this.hydrating || !pendingMermaidNodes(root).length) {
      return;
    }
    this.hydrating = true;
    void hydrateCourseMermaid(root).finally(() => {
      this.hydrating = false;
    });
  }
}
