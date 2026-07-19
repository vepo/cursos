import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map, of } from 'rxjs';

import {
  ConfirmationDialogComponent,
  ConfirmationDialogData
} from '../components/confirmation-dialog/confirmation-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  private readonly dialog = inject(MatDialog);

  confirm(data: ConfirmationDialogData): Observable<boolean> {
    return this.dialog
      .open(ConfirmationDialogComponent, {
        data,
        autoFocus: 'dialog',
        restoreFocus: true
      })
      .afterClosed()
      .pipe(map(result => result === true));
  }

  confirmOrTrue(needsConfirm: boolean, data: ConfirmationDialogData): Observable<boolean> {
    if (!needsConfirm) {
      return of(true);
    }
    return this.confirm(data);
  }
}
