import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

// ✅ IMPORTANT: Drag & Drop Module
import { DragDropModule } from '@angular/cdk/drag-drop';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),

    // ✅ REQUIRED for drag-drop animations
    provideNoopAnimations(),

    // ✅ REQUIRED for CDK DragDrop
    importProvidersFrom(DragDropModule)
  ]
};