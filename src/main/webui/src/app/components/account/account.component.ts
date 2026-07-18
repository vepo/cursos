import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AccountApi } from '../../generated/api/account.service';
import { AuthApi } from '../../generated/api/auth.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule]
})
export class AccountComponent implements OnInit {
  private readonly authApi = inject(AuthApi);
  private readonly accountApi = inject(AccountApi);
  private readonly authService = inject(AuthService);

  username = '';
  name = '';
  email = '';
  description = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  profileMessage = '';
  profileError = '';
  passwordMessage = '';
  passwordError = '';
  savingProfile = false;
  changingPassword = false;

  ngOnInit(): void {
    this.authApi.me().subscribe({
      next: me => {
        this.username = me.username ?? '';
        this.name = me.name ?? '';
        this.email = me.email ?? '';
        this.description = me.description ?? '';
      },
      error: () => {
        this.username = this.authService.getUsername() ?? '';
        this.name = this.authService.getDisplayName() ?? '';
        this.email = this.authService.getEmail() ?? '';
      }
    });
  }

  saveProfile(): void {
    this.profileMessage = '';
    this.profileError = '';
    this.savingProfile = true;
    this.accountApi.updateAccount({
      name: this.name.trim(),
      email: this.email.trim(),
      description: this.description.trim()
    }).subscribe({
      next: account => {
        this.name = account.name ?? this.name;
        this.email = account.email ?? this.email;
        this.description = account.description ?? this.description;
        this.profileMessage = 'Perfil atualizado.';
        this.savingProfile = false;
      },
      error: () => {
        this.profileError = 'Não foi possível atualizar o perfil.';
        this.savingProfile = false;
      }
    });
  }

  changePassword(): void {
    this.passwordMessage = '';
    this.passwordError = '';
    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'A confirmação da nova senha não confere.';
      return;
    }
    this.changingPassword = true;
    this.accountApi.changeAccountPassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.passwordMessage = 'Senha alterada.';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.changingPassword = false;
      },
      error: () => {
        this.passwordError = 'Não foi possível alterar a senha.';
        this.changingPassword = false;
      }
    });
  }
}
