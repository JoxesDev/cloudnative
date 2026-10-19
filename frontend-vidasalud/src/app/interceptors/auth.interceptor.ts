import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, timeout } from 'rxjs/operators';
import { msalInstance } from '../app.config';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo adjuntar token a peticiones a nuestra API
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    // En modo de rol simulado (pruebas docentes), no llamamos a Azure AD para evitar bloqueos
    const devRole = localStorage.getItem('vidasalud_dev_role');
    if (devRole && devRole !== 'RESET') {
      return next.handle(req);
    }

    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (!account) {
      return next.handle(req);
    }

    // Asegurar cuenta activa
    if (!msalInstance.getActiveAccount()) {
      msalInstance.setActiveAccount(account);
    }

    return from(
      msalInstance.acquireTokenSilent({
        scopes: [environment.msal.scope],
        account: account
      })
    ).pipe(
      timeout(2500),
      switchMap(tokenResponse => {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${tokenResponse.accessToken}`
          }
        });
        return next.handle(authReq);
      }),
      catchError(err => {
        console.warn('AuthInterceptor: Fallback sin token tras acquireTokenSilent:', err?.message || err);
        return next.handle(req);
      })
    );
  }
}
