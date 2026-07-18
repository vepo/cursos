import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  templateUrl: './app.html'
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  title = 'cursos';

  isAuthenticated(): boolean {
    return this.authService.isLoggedIn();
  }

  userEmail(): string | null {
    return this.authService.getEmail();
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
