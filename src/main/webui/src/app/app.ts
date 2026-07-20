import { Component, DestroyRef, ElementRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, fromEvent } from 'rxjs';
import { AuthService } from './services/auth.service';
import { BrandingService } from './services/branding.service';

const CURSOS_ADMIN_ROLE = 'cursos.admin';
const SHELL_NAVIGATION_ID = 'shell-navigation';

interface NavigationItem {
  readonly label: string;
  readonly route: string;
  readonly fragment?: string;
}

interface NavigationGroup {
  readonly label: string;
  readonly items: readonly NavigationItem[];
  readonly requiredRole?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly brandingService = inject(BrandingService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('menuToggle', { read: ElementRef })
  private readonly menuToggle?: ElementRef<HTMLButtonElement>;

  readonly branding = this.brandingService.branding();
  readonly copyrightYear = new Date().getFullYear();
  readonly shellNavigationId = SHELL_NAVIGATION_ID;
  readonly navigationGroups: readonly NavigationGroup[] = [
    {
      label: 'Aprender',
      items: [
        { label: 'Catálogo', route: '/' },
        { label: 'Meus cursos', route: '/', fragment: 'matriculado' }
      ]
    },
    {
      label: 'Ensinar',
      items: [
        { label: 'Meus cursos', route: '/teacher' },
        { label: 'Novo curso', route: '/teacher/courses/new' }
      ]
    },
    {
      label: 'Conta',
      items: [
        { label: 'Minha conta', route: '/account' }
      ]
    },
    {
      label: 'Admin',
      requiredRole: CURSOS_ADMIN_ROLE,
      items: [
        { label: 'Categorias', route: '/admin/categories' }
      ]
    }
  ];

  menuOpen = false;

  constructor() {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter(event => event.key === 'Escape'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.closeMenuOnEscape());
  }

  visibleNavigationGroups(): readonly NavigationGroup[] {
    return this.navigationGroups.filter(group =>
      !group.requiredRole || this.authService.hasRole(group.requiredRole));
  }

  navigationGroupLabelId(group: NavigationGroup): string {
    return `nav-group-${group.label}`;
  }

  isAuthenticated(): boolean {
    return this.authService.isLoggedIn();
  }

  userEmail(): string | null {
    return this.authService.getEmail();
  }

  displayName(): string | null {
    return this.authService.getDisplayName() ?? this.authService.getEmail();
  }

  toggleMenu(): void {
    if (this.menuOpen) {
      this.closeMenu();
      return;
    }
    this.openMenu();
  }

  openMenu(): void {
    this.menuOpen = true;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  closeMenuOnEscape(): void {
    if (!this.menuOpen) {
      return;
    }
    this.closeMenu();
    this.menuToggle?.nativeElement.focus();
  }

  logout(): void {
    this.closeMenu();
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
