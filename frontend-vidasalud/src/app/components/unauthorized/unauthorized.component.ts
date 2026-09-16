import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unauth-container">
      <div class="unauth-card">
        <div class="icon-circle">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        </div>
        <span class="status-code">HTTP 403 FORBIDDEN</span>
        <h1 class="unauth-title">Acceso Denegado</h1>
        <p class="unauth-desc">
          Tu cuenta actual no posee los roles requeridos en Microsoft Entra ID para acceder a este recurso.
        </p>
        <div class="action-row">
          <a routerLink="/appointments" class="btn-back">Ir a Atenciones</a>
          <a routerLink="/login" class="btn-login-alt">Cambiar de Cuenta</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauth-container {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .unauth-card {
      background: white;
      border: 1px solid #fee2e2;
      border-radius: 16px;
      padding: 3rem 2rem;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.1);
    }
    .icon-circle {
      width: 72px;
      height: 72px;
      background: #fef2f2;
      color: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
    }
    .status-code {
      font-size: 0.75rem;
      font-weight: 800;
      color: #ef4444;
      letter-spacing: 0.1em;
    }
    .unauth-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0.5rem 0 0.75rem 0;
    }
    .unauth-desc {
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 2rem;
    }
    .action-row {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    .btn-back {
      background: #0284c7;
      color: white;
      text-decoration: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .btn-login-alt {
      background: #f1f5f9;
      color: #334155;
      text-decoration: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
    }
  `]
})
export class UnauthorizedComponent {}
