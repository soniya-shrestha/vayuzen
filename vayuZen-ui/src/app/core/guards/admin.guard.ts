import { Injectable } from '@angular/core';
import { CanActivate, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';


@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate  {
    constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {

    // Must have a valid token AND be an admin
    if (this.authService.getToken() && this.authService.isAdmin()) {
      return true;
    }

    this.router.navigate(['/auth/login']);
    return false;
  }
};
