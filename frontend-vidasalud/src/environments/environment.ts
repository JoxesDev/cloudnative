const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : 'localhost';
const protocol = isBrowser ? window.location.protocol : 'http:';
const origin = isBrowser ? window.location.origin : 'http://localhost:4200';

export const environment = {
  production: false,
  msal: {
    clientId: 'c6d8da59-5b41-4ce9-ac81-192a3dafc87e',
    tenantId: '9333d7eb-2af5-4631-835e-78e32d2ae6d1',
    redirectUri: origin,
    apiUri: `${protocol}//${host}:8082`,
    scope: 'api://471213b2-94cc-4f45-bc30-d084984ac045/access_as_user'
  }
};
