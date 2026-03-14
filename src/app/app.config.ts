import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes'; 
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS} from '@angular/common/http';
import { MockApiInterceptor } from './mock-api-interceptor';

// Import Google Auth entities
import { GoogleLoginProvider, SocialAuthServiceConfig } from '@abacritt/angularx-social-login';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: MockApiInterceptor, 
      multi: true 
    }, // Ensure this comma exists
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(
              '131038262363-v1h7203mn6c6pb9616sivkknb6rkibos.apps.googleusercontent.com'
            )
          }
        ],
        onError: (err: any) => console.error(err)
      } as SocialAuthServiceConfig
    }
  ]
};