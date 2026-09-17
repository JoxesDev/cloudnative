import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable, from, switchMap, catchError, of } from 'rxjs';
import { msalInstance } from '../app.config';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Solo adjuntar token a peticiones a nuestra API
    if (!req.url.includes('/api/')) {
      return next.handle(req);
    }

    const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
    if (!account) {
      console.warn('AuthInterceptor: No hay cuenta activa, enviando sin token');
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
      switchMap(tokenResponse => {
        console.log('AuthInterceptor: Token adquirido, adjuntando Bearer header');
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${tokenResponse.accessToken}`
          }
        });
        return next.handle(authReq);
      }),
      catchError(err => {
        console.error('AuthInterceptor: Error adquiriendo token silencioso:', err);
        // Intentar con popup/redirect si el token silencioso falla
        return next.handle(req);
      })
    );
  }
}
