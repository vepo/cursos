import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    profiles?: string[];
  };
}

interface JwtPayload {
  id?: number;
  username?: string;
  name?: string;
  email?: string;
  groups?: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'jwt_token';

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password })
      .pipe(tap(response => this.saveToken(response.token)));
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserId(): number | null {
    const payload = this.payload();
    return payload?.id ?? null;
  }

  getDisplayName(): string | null {
    const payload = this.payload();
    return payload?.name ?? payload?.username ?? null;
  }

  getUsername(): string | null {
    return this.payload()?.username ?? null;
  }

  getEmail(): string | null {
    return this.payload()?.email ?? null;
  }

  hasRole(role: string): boolean {
    const groups = this.payload()?.groups;
    return Array.isArray(groups) && groups.includes(role);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private payload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const encodedPayload = token.split('.')[1];
      if (!encodedPayload) {
        return null;
      }
      const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}
