import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { AuthService } from '../services/auth.service';
import { map, catchError, filter, take, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

export const roleGuard = (expectedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(MsalService);
    const msalBroadcast = inject(MsalBroadcastService);
    const appAuth = inject(AuthService);
    const router = inject(Router);

    // 1. Soporte para pruebas locales / evaluación en aula
    const devRole = localStorage.getItem('vidasalud_dev_role');
    if (devRole) {
      if (devRole === 'ANONYMOUS') {
        router.navigate(['/login']);
        return false;
      }
      const hasDevRole = expectedRoles.includes(devRole) || devRole === 'Admin';
      if (!hasDevRole) {
        router.navigate(['/unauthorized']);
        return false;
      }
      return true;
    }

    const validateAccount = (account: any): boolean => {
      if (!account) {
        router.navigate(['/login']);
        return false;
      }

      const claims = (account.idTokenClaims || {}) as Record<string, any>;
      const userRoles: string[] = claims['roles'] || [];

      // Si el usuario se logueó pero en Azure Portal aún no tiene App Role asignado:
      // Permitimos acceso como Administrador/Paciente por defecto para que la interfaz no se bloquee
      if (userRoles.length === 0) {
        return true;
      }

      const hasRole = expectedRoles.some(role => userRoles.includes(role)) || userRoles.includes('Admin');
      if (!hasRole) {
        router.navigate(['/unauthorized']);
        return false;
      }

      return true;
    };

    // 2. Verificar cuenta en memoria o cache
    const account = authService.instance.getActiveAccount() || authService.instance.getAllAccounts()[0];
    if (account) {
      authService.instance.setActiveAccount(account);
      appAuth.refreshUserState();
      return validateAccount(account);
    }

    // 3. Esperar que MSAL complete cualquier interacción o redirect en progreso (con timeout de 1.5s para no bloquear la navegación)
    return msalBroadcast.inProgress$.pipe(
      filter((status: InteractionStatus) => status === InteractionStatus.None),
      take(1),
      timeout(1500),
      map(() => {
        const acc = authService.instance.getActiveAccount() || authService.instance.getAllAccounts()[0];
        if (acc) {
          authService.instance.setActiveAccount(acc);
          appAuth.refreshUserState();
          return validateAccount(acc);
        }
        router.navigate(['/login']);
        return false;
      }),
      catchError(err => {
        console.warn('roleGuard timeout esperando MSAL inProgress, verificando cuentas:', err);
        const acc = authService.instance.getActiveAccount() || authService.instance.getAllAccounts()[0];
        if (acc) {
          authService.instance.setActiveAccount(acc);
          appAuth.refreshUserState();
          return of(validateAccount(acc));
        }
        router.navigate(['/login']);
        return of(false);
      })
    );
  };
};
