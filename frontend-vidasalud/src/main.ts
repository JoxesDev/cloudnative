import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig, msalInstance } from './app/app.config';
import { App } from './app/app';

msalInstance.initialize().then(() => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }
  bootstrapApplication(App, appConfig)
    .catch((err) => console.error(err));
}).catch((err) => {
  console.error('Error inicializando MSAL:', err);
});

