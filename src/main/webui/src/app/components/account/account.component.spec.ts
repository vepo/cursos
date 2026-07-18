import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AccountApi } from '../../generated/api/account.service';
import { AuthApi } from '../../generated/api/auth.service';
import { AuthService } from '../../services/auth.service';
import { AccountComponent } from './account.component';

describe('AccountComponent', () => {
  let fixture: ComponentFixture<AccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountComponent, NoopAnimationsModule],
      providers: [
        {
          provide: AuthApi,
          useValue: jasmine.createSpyObj('AuthApi', {
            me: of({
              id: 1,
              username: 'cto-boss',
              name: 'CTO',
              email: 'cto@passport.vepo.dev',
              description: 'Autor de cursos backend',
              roles: []
            })
          })
        },
        {
          provide: AccountApi,
          useValue: jasmine.createSpyObj('AccountApi', {
            updateAccount: of({
              id: 1,
              username: 'cto-boss',
              name: 'CTO Boss',
              email: 'cto@passport.vepo.dev',
              description: 'Autor de cursos backend',
              roles: []
            }),
            changeAccountPassword: of({})
          })
        },
        {
          provide: AuthService,
          useValue: jasmine.createSpyObj('AuthService', {
            getUsername: 'cto-boss',
            getDisplayName: 'CTO',
            getEmail: 'cto@passport.vepo.dev'
          })
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AccountComponent);
    fixture.detectChanges();
  });

  it('shouldRenderProfileAndPasswordSections', () => {
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Minha conta');
    expect(text).toContain('Perfil');
    expect(text).toContain('Alterar senha');
    expect(fixture.nativeElement.querySelector('[data-testid="save-profile"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="change-password"]')).not.toBeNull();
  });

  it('shouldLoadAndSaveAuthorDescription', () => {
    const textarea = fixture.nativeElement.querySelector('[data-testid="author-description"]') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.value).toContain('Autor de cursos backend');

    const accountApi = TestBed.inject(AccountApi) as jasmine.SpyObj<AccountApi>;
    textarea.value = 'Nova bio do autor';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-testid="save-profile"]').click();
    fixture.detectChanges();

    expect(accountApi.updateAccount).toHaveBeenCalledWith(jasmine.objectContaining({
      description: 'Nova bio do autor'
    }));
  });
});
