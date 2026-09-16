import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="brand">
          <div class="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 4v16m-8-8h16" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">VidaSalud</span>
            <span class="brand-sub">Cloud Native Care</span>
          </div>
        </a>

        <nav class="nav-links">
          <a routerLink="/appointments" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Atenciones
          </a>

          <a routerLink="/catalog" routerLinkActive="active" class="nav-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Catálogo
            <span class="tag-role">Admin/Recep</span>
          </a>
        </nav>

        <div class="nav-actions">
          <!-- Switcher para pruebas locales de roles -->
          <div class="dev-role-selector">
            <span class="dev-label">Simular Rol:</span>
            <select [value]="currentRoleValue()" (change)="onRoleChange($event)" class="role-select">
              <option value="RESET">Usar Microsoft Entra ID real</option>
              <option value="Admin">Admin (Control Total)</option>
              <option value="Recepcionista">Recepcionista (Atenciones + Catálogo)</option>
              <option value="Paciente">Paciente (Solo Atenciones)</option>
              <option value="Auditor">Auditor (Lectura)</option>
              <option value="ANONYMOUS">No Autenticado (401)</option>
            </select>
          </div>

          <!-- Información del Usuario -->
          <div class="user-badge" *ngIf="user().isAuthenticated; else loginBtn">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-info">
              <span class="user-name">{{ user().name }}</span>
              <div class="user-roles">
                <span class="role-badge" *ngFor="let role of user().roles">{{ role }}</span>
                <span class="mock-indicator" *ngIf="user().isMock">MODO PRUEBA</span>
              </div>
            </div>
            <button (click)="logout()" class="btn-logout" title="Cerrar sesión">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>

          <ng-template #loginBtn>
            <button (click)="login()" class="btn-login">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
              </svg>
              Iniciar con Microsoft
            </button>
          </ng-template>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      background: #0f172a;
      color: #f8fafc;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.3);
    }
    .nav-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #0284c7, #0d9488);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: block;
      line-height: 1.2;
    }
    .brand-sub {
      font-size: 0.7rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .nav-links {
      display: flex;
      gap: 0.5rem;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .nav-link:hover {
      background: rgba(255, 255, 255, 0.06);
      color: white;
    }
    .nav-link.active {
      background: rgba(2, 132, 199, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .tag-role {
      font-size: 0.65rem;
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .dev-role-selector {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255, 255, 255, 0.04);
      padding: 0.3rem 0.6rem;
      border-radius: 8px;
      border: 1px dashed rgba(255, 255, 255, 0.2);
    }
    .dev-label {
      font-size: 0.72rem;
      color: #94a3b8;
    }
    .role-select {
      background: #1e293b;
      color: #f1f5f9;
      border: 1px solid #334155;
      padding: 0.25rem 0.5rem;
      font-size: 0.78rem;
      border-radius: 6px;
      cursor: pointer;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.35rem 0.75rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #f8fafc;
    }
    .user-roles {
      display: flex;
      gap: 0.3rem;
      align-items: center;
    }
    .role-badge {
      font-size: 0.65rem;
      background: #0369a1;
      color: #e0f2fe;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .mock-indicator {
      font-size: 0.6rem;
      background: #854d0e;
      color: #fef08a;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
    }
    .btn-logout {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      transition: all 0.2s;
    }
    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }
    .btn-login {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-login:hover {
      background: #1d4ed8;
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;

  get userInitial(): string {
    const name = this.user().name;
    return name ? name.charAt(0).toUpperCase() : 'U';
  }

  currentRoleValue(): string {
    const devRole = localStorage.getItem('vidasalud_dev_role');
    return devRole || 'RESET';
  }

  onRoleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.authService.setMockRole(select.value);
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }
}
