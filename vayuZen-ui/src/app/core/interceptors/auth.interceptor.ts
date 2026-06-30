import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse,HttpEvent,} from '@angular/common/http';  
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
 
  constructor(private authService: AuthService, private router: Router) {}
 
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
 
    // Get the stored JWT token
    const token = this.authService.getToken();
 
    // If we have a token, clone the request and add the Authorization header
    // This means Angular automatically sends the token with EVERY API call
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
 
    // Pass the (possibly modified) request along, and handle errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
 
        // If we get a 401 (Unauthorized), the token is expired or invalid
        // Log the user out and send them back to login
        if (error.status === 401) {
          this.authService.logout();
        }
 
        return throwError(() => error);
      })
    );
  }
}
