import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig, msalInstance } from './app/app.config';
import { App } from './app/app';

async function startApp() {
  try {
    await msalInstance.initialize();
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  } catch (err) {
    console.warn('MSAL no pudo inicializarse con Web Crypto (típico en HTTP/IP no segura), continuando en modo demostración/dev:', err);
  }

  try {
    await bootstrapApplication(App, appConfig);
  } catch (err) {
    console.error('Error al inicializar la aplicación Angular:', err);
  }
}

startApp();
