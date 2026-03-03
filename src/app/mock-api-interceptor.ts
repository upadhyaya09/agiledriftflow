import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class MockApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/api/')) {
      // Returning a formal HttpResponse is what forces the Network tab to show a row
      return of(new HttpResponse({ 
        status: 200, 
        statusText: 'OK',
        body: { status: 'success', message: 'Action Captured', data: req.body } ,
        url: req.url
      })).pipe(delay(400)); // The delay ensures it doesn't disappear too fast
    }
    return next.handle(req);
  }
}