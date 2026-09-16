import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType, InteractionStatus } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UserProfile {
  name: string;
  username: string;
  roles: string[];
  isAuthenticated: boolean;
  isMock: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msal = inject(MsalService);
  private msalBroadcast = inject(MsalBroadcastService);

  readonly currentUser = signal<UserProfile>({
    name: 'Usuario Invitado',
    username: '',
    roles: [],
    isAuthenticated: false,
    isMock: false
  });

  constructor() {
    this.initMsalListener();
    this.refreshUserState();
  }

  private initMsalListener() {
    this.msalBroadcast.msalSubject$
      .pipe(
        filter((msg: EventMessage) =>
          msg.eventType === EventType.LOGIN_SUCCESS ||
          msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
          msg.eventType === EventType.ACTIVE_ACCOUNT_CHANGED
        )
      )
      .subscribe((result) => {
        const payload = result.payload as any;
        if (payload && payload.account) {
          this.msal.instance.setActiveAccount(payload.account);
        }
        this.refreshUserState();
      });

    this.msalBroadcast.inProgress$
      .pipe(filter((status: InteractionStatus) => status === InteractionStatus.None))
      .subscribe(() => {
        this.refreshUserState();
      });
  }

  refreshUserState() {
    const devRole = localStorage.getItem('vidasalud_dev_role');
    if (devRole && devRole !== 'ANONYMOUS') {
      this.currentUser.set({
        name: `Usuario Modo Prueba (${devRole})`,
        username: `test.${devRole.toLowerCase()}@vidasalud.cl`,
        roles: [devRole],
        isAuthenticated: true,
        isMock: true
      });
      return;
    } else if (devRole === 'ANONYMOUS') {
      this.currentUser.set({
        name: 'Invitado No Autenticado',
        username: '',
        roles: [],
        isAuthenticated: false,
        isMock: true
      });
      return;
    }

    const account = this.msal.instance.getActiveAccount() || this.msal.instance.getAllAccounts()[0];
    if (account) {
      const claims = (account.idTokenClaims || {}) as Record<string, any>;
      const roles: string[] = (claims['roles'] && claims['roles'].length > 0)
        ? claims['roles']
        : ['Admin (Default Azure)'];

      this.currentUser.set({
        name: account.name || account.username || 'Usuario Entra ID',
        username: account.username || '',
        roles: roles,
        isAuthenticated: true,
        isMock: false
      });
    } else {
      this.currentUser.set({
        name: 'Usuario Invitado',
        username: '',
        roles: [],
        isAuthenticated: false,
        isMock: false
      });
    }
  }

  private router = inject(Router);

  login() {
    // Usamos loginRedirect por defecto para compatibilidad total con navegadores y evitar bloqueadores de popups
    this.loginRedirect();
  }

  loginRedirect() {
    this.msal.loginRedirect({
      scopes: [environment.msal.scope]
    }).subscribe({
      next: () => {
        this.refreshUserState();
      },
      error: (err) => {
        console.error('Error al iniciar loginRedirect con Microsoft Entra ID:', err);
      }
    });
  }

  loginPopup() {
    this.msal.loginPopup({
      scopes: [environment.msal.scope]
    }).subscribe({
      next: (result) => {
        if (result && result.account) {
          this.msal.instance.setActiveAccount(result.account);
        }
        this.refreshUserState();
        this.router.navigate(['/appointments']);
      },
      error: (err) => {
        console.warn('Popup bloqueado o cancelado, intentando redirect completo:', err);
        this.loginRedirect();
      }
    });
  }

  logout() {
    localStorage.removeItem('vidasalud_dev_role');
    const account = this.msal.instance.getActiveAccount() || this.msal.instance.getAllAccounts()[0];
    if (account) {
      this.msal.logoutRedirect({
        postLogoutRedirectUri: window.location.origin + '/login'
      }).subscribe({
        error: (err) => console.error('Error durante logoutRedirect:', err)
      });
    } else {
      this.refreshUserState();
      this.router.navigate(['/login']);
    }
  }

  setMockRole(role: string) {
    if (role === 'RESET') {
      localStorage.removeItem('vidasalud_dev_role');
    } else {
      localStorage.setItem('vidasalud_dev_role', role);
    }
    this.refreshUserState();
    if (role !== 'ANONYMOUS' && role !== 'RESET') {
      this.router.navigate(['/appointments']);
    } else if (role === 'ANONYMOUS') {
      this.router.navigate(['/login']);
    }
  }

  hasRole(expectedRoles: string[]): boolean {
    const user = this.currentUser();
    if (!user.isAuthenticated) return false;
    if (user.roles.includes('Admin')) return true;
    return expectedRoles.some(r => user.roles.includes(r));
  }
}
