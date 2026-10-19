import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import {
  IPublicClientApplication,
  PublicClientApplication,
  BrowserCacheLocation
} from '@azure/msal-browser';
import {
  MsalGuard,
  MsalGuardConfiguration,
  MsalBroadcastService,
  MsalService,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG
} from '@azure/msal-angular';
import { environment } from '../environments/environment';
import { AuthInterceptor } from './interceptors/auth.interceptor';

const clientId = environment.msal.clientId && !environment.msal.clientId.includes('<')
  ? environment.msal.clientId
  : '11111111-1111-1111-1111-111111111111';

const tenantId = environment.msal.tenantId && !environment.msal.tenantId.includes('<')
  ? environment.msal.tenantId
  : 'common';

export const msalInstance: IPublicClientApplication = new PublicClientApplication({
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: environment.msal.redirectUri
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage
  }
});

export function MSALInstanceFactory(): IPublicClientApplication {
  return msalInstance;
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: 'redirect' as any,
    authRequest: {
      scopes: [environment.msal.scope]
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    // Solo AuthInterceptor personalizado — maneja acquireTokenSilent con fallback local
    // Se eliminó MsalInterceptor para evitar que absorba errores InteractionRequired
    // en usuarios reales de Azure AD e impida que llegue al .error() del subscribe
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};

