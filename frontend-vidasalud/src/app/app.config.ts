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

function createMsalInstance(): IPublicClientApplication {
  try {
    return new PublicClientApplication({
      auth: {
        clientId: clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: environment.msal.redirectUri
      },
      cache: {
        cacheLocation: BrowserCacheLocation.LocalStorage
      }
    });
  } catch (e) {
    console.warn('Fallback seguro de MSAL (modo demostración / contexto HTTP):', e);
    return {
      initialize: async () => {},
      getAllAccounts: () => [],
      getActiveAccount: () => null,
      setActiveAccount: () => {},
      loginRedirect: async () => {},
      loginPopup: async () => ({} as any),
      logoutRedirect: async () => {},
      acquireTokenSilent: async () => ({} as any),
      handleRedirectPromise: async () => null,
      getLogger: () => ({ error: () => {}, warn: () => {}, info: () => {}, verbose: () => {} } as any)
    } as unknown as IPublicClientApplication;
  }
}

export const msalInstance: IPublicClientApplication = createMsalInstance();

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
