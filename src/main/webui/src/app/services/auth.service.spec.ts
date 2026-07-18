import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

function buildJwt(groups: string[]): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    id: 1,
    email: 'cto@passport.vepo.dev',
    name: 'CTO',
    groups,
    exp: Math.floor(Date.now() / 1000) + 3600
  }));
  return `${header}.${payload}.sig`;
}

describe('AuthService JWT groups (T17)', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('shouldReportCursosAdminFromJwtGroupsClaim', () => {
    service.saveToken(buildJwt(['USER', 'cursos.admin']));

    const auth = service as AuthService & { hasRole(role: string): boolean };
    expect(typeof auth.hasRole).withContext('AuthService.hasRole').toBe('function');
    expect(auth.hasRole('cursos.admin')).toBeTrue();
    expect(auth.hasRole('passport.admin')).toBeFalse();
  });

  it('shouldDenyCursosAdminWhenJwtGroupsOmitRole', () => {
    service.saveToken(buildJwt(['USER']));

    const auth = service as AuthService & { hasRole(role: string): boolean };
    expect(typeof auth.hasRole).withContext('AuthService.hasRole').toBe('function');
    expect(auth.hasRole('cursos.admin')).toBeFalse();
  });
});