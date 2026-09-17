import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation
} from '@azure/msal-browser';
import {
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalGuard,
  MsalGuardConfiguration,
  MsalBroadcastService,
  MsalService,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG
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

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set(environment.msal.apiUri, [environment.msal.scope]);
  protectedResourceMap.set(`${environment.msal.apiUri}/api`, [environment.msal.scope]);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    { provide: MSAL_INSTANCE, useFactory: MSALInstanceFactory },
    { provide: MSAL_GUARD_CONFIG, useFactory: MSALGuardConfigFactory },
    { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: MSALInterceptorConfigFactory },
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};

