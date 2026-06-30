import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service'; 
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {
 
  constructor(private authService: AuthService, private router: Router) {}
 
  canActivate(): boolean {
 
    // If user has a valid token → allow access to the route
    if (this.authService.getToken()) {
      return true;
    }
 
    // Otherwise → redirect to login page
    this.router.navigate(['/auth/login']);
    return false;
  }
}
