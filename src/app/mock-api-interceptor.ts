import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check for Login or Register requests
    if (request.url.endsWith('/api/login') || request.url.endsWith('/api/register')) {
      return of(new HttpResponse({ 
        status: 200, 
        body: { message: 'Success' , token: 'mock-token' } 
      })).pipe(delay(500));
    }
    return next.handle(request);
  }
}