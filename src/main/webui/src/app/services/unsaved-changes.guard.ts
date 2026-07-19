import { CanDeactivateFn } from '@angular/router';
import { Observable, isObservable, of } from 'rxjs';

export interface DirtyComponent {
  canDeactivate(): boolean | Observable<boolean>;
}

export const unsavedChangesGuard: CanDeactivateFn<DirtyComponent> = component => {
  if (!component?.canDeactivate) {
    return true;
  }
  const result = component.canDeactivate();
  return isObservable(result) ? result : of(result);
};
