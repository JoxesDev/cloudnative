import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="brand-badge">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 4v16m-8-8h16" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="portal-title">Portal VidaSalud</h1>
        <p class="portal-subtitle">Gestión Clínica y Autenticación Centralizada</p>

        <!-- Sección Microsoft Entra ID (Producción / SSO) -->
        <div class="auth-box">
          <p class="auth-info">
            Inicia sesión con tu cuenta corporativa de <strong>Microsoft Entra ID</strong> (Azure AD) para acceder con tus credenciales y roles sincronizados.
          </p>

          <button (click)="login()" [disabled]="isLoggingIn()" class="btn-ms-login">
            <ng-container *ngIf="!isLoggingIn()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
              </svg>
              Iniciar Sesión con Microsoft
            </ng-container>
            <ng-container *ngIf="isLoggingIn()">
              <span class="spinner"></span>
              Redirigiendo a Microsoft...
            </ng-container>
          </button>

          <button (click)="loginPopup()" [disabled]="isLoggingIn()" class="btn-ms-popup">
            Abrir ventana emergente (Popup alternativo)
          </button>
        </div>

        <!-- Separador de opciones -->
        <div class="divider">
          <span>O ACCESO DE EVALUACIÓN</span>
        </div>

        <!-- Acceso Rápido para Pruebas / Demostración en Aula -->
        <div class="dev-box">
          <div class="dev-header">
            <span class="dev-title">Modo Evaluación Rápida (1 Clic)</span>
            <span class="dev-badge">Pruebas EP1</span>
          </div>
          <p class="dev-info">
            Para evaluar los módulos y Guards sin requerir cuenta institucional activa, selecciona un perfil:
          </p>

          <div class="dev-role-buttons">
            <button (click)="selectRole('Admin')" class="btn-role btn-role-admin">
              <span class="role-icon">🛡️</span>
              <div class="role-desc">
                <strong>Admin</strong>
                <small>Control total (Atenciones + Catálogo)</small>
              </div>
            </button>

            <button (click)="selectRole('Recepcionista')" class="btn-role btn-role-recep">
              <span class="role-icon">📋</span>
              <div class="role-desc">
                <strong>Recepcionista</strong>
                <small>Gestión de Citas y Catálogo</small>
              </div>
            </button>

            <button (click)="selectRole('Paciente')" class="btn-role btn-role-paciente">
              <span class="role-icon">🩺</span>
              <div class="role-desc">
                <strong>Paciente</strong>
                <small>Reserva y consulta de citas</small>
              </div>
            </button>

            <button (click)="selectRole('Auditor')" class="btn-role btn-role-auditor">
              <span class="role-icon">🔍</span>
              <div class="role-desc">
                <strong>Auditor</strong>
                <small>Modo supervisión y lectura</small>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 85vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }
    .login-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 2.5rem 2rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08);
    }
    .brand-badge {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #0284c7, #0d9488);
      color: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.25rem;
      box-shadow: 0 8px 16px rgba(2, 132, 199, 0.3);
    }
    .portal-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .portal-subtitle {
      color: #64748b;
      font-size: 0.88rem;
      margin: 0.35rem 0 1.5rem 0;
    }
    .auth-box {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .auth-info {
      font-size: 0.88rem;
      color: #475569;
      line-height: 1.5;
      margin: 0 0 0.5rem 0;
    }
    .btn-ms-login {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background: #0f172a;
      color: white;
      border: none;
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
      transition: all 0.2s;
    }
    .btn-ms-login:hover:not(:disabled) {
      background: #1e293b;
      transform: translateY(-1px);
    }
    .btn-ms-login:disabled {
      opacity: 0.75;
      cursor: not-allowed;
    }
    .btn-ms-popup {
      background: transparent;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-ms-popup:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #94a3b8;
    }
    .btn-ms-popup:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .divider {
      position: relative;
      text-align: center;
      margin: 1.75rem 0 1.25rem 0;
    }
    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }
    .divider span {
      position: relative;
      background: white;
      padding: 0 0.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.08em;
    }
    .dev-box {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 1rem;
      text-align: left;
    }
    .dev-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .dev-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #334155;
    }
    .dev-badge {
      font-size: 0.65rem;
      font-weight: 700;
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .dev-info {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0 0 0.85rem 0;
      line-height: 1.4;
    }
    .dev-role-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .btn-role {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.55rem 0.75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: white;
      cursor: pointer;
      transition: all 0.15s;
      text-align: left;
    }
    .btn-role:hover {
      transform: translateX(3px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    .btn-role-admin:hover { border-color: #f87171; background: #fff5f5; }
    .btn-role-recep:hover { border-color: #fbbf24; background: #fffbeb; }
    .btn-role-paciente:hover { border-color: #60a5fa; background: #eff6ff; }
    .btn-role-auditor:hover { border-color: #c084fc; background: #faf5ff; }
    .role-icon {
      font-size: 1.1rem;
      line-height: 1;
    }
    .role-desc {
      display: flex;
      flex-direction: column;
    }
    .role-desc strong {
      font-size: 0.82rem;
      color: #1e293b;
    }
    .role-desc small {
      font-size: 0.72rem;
      color: #64748b;
    }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoggingIn = signal(false);

  ngOnInit(): void {
    if (this.authService.currentUser().isAuthenticated) {
      this.router.navigate(['/appointments']);
    }
  }

  login() {
    this.isLoggingIn.set(true);
    this.authService.login();
  }

  loginPopup() {
    this.isLoggingIn.set(true);
    this.authService.loginPopup();
  }

  selectRole(role: string) {
    this.authService.setMockRole(role);
  }
}
