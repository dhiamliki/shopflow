import '@angular/compiler';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

console.log('[ShopFlow] Starting application...');

// Add global error handler before bootstrap
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[ShopFlow] Global error:', { message, source, lineno, colno, error });
  return false;
};

window.onunhandledrejection = (event) => {
  console.error('[ShopFlow] Unhandled promise rejection:', event.reason);
};

bootstrapApplication(App, appConfig)
  .then(() => {
    console.log('[ShopFlow] Application bootstrapped successfully');
  })
  .catch((err) => {
    console.error('[ShopFlow] Bootstrap error:', err);
  });
