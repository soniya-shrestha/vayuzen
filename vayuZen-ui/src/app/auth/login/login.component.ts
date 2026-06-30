import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
 
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Build the form with validators
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }
 
  // Shortcut to get form controls (used in the template)
  get f() { return this.loginForm.controls; }
 
  onSubmit(): void {
    // Mark all fields as touched so validation errors show up
    this.loginForm.markAllAsTouched();
 
    if (this.loginForm.invalid) return;
 
    this.isLoading = true;
    this.errorMessage = '';
 
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        // Login successful → go to dashboard
        this.router.navigate(['/user/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        // Show the error message from the backend, or a fallback
        this.errorMessage = err.error?.message || 'Invalid email or password. Please try again.';
      }
    });
  }
}
