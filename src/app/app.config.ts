import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes'; // Verify this path!
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS} from '@angular/common/http';
import { MockApiInterceptor } from './mock-api-interceptor'; // update path

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes) ,
    provideHttpClient(withInterceptorsFromDi()),
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: MockApiInterceptor, 
      multi: true 
    }
  ]
};