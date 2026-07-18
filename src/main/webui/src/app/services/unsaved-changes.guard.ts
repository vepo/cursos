import { CanDeactivateFn } from '@angular/router';

export interface DirtyComponent {
  canDeactivate(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<DirtyComponent> = component => {
  if (!component?.canDeactivate) {
    return true;
  }
  return component.canDeactivate();
};
