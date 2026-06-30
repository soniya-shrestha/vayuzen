import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';


export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  ageGroup: 'CHILD' | 'YOUNG_ADULT' | 'ADULT' | 'ELDERLY';
  healthCondition: 'NONE' | 'ASTHMA' | 'HEART_DISEASE' | 'DIABETES' | 'RESPIRATORY';
}
 
export interface LoginRequest {
  email: string;
  password: string;
}
 
export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  ageGroup: string;
  healthCondition: string;
  message: string;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
 
  // Your Spring Boot backend URL
  private readonly API_URL = 'http://localhost:8080/api/auth';
 
  // Keys used to save data in localStorage
  private readonly TOKEN_KEY = 'vayuzen_token';
  private readonly USER_KEY  = 'vayuzen_user';
 
  // BehaviorSubject = like a variable that Angular components can "subscribe" to
  // Whenever it changes, all subscribed components update automatically
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
 
  constructor(private http: HttpClient, private router: Router) {}
 
  // ─── Register ───────────────────────────────────────────────────────────────
 
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
      tap(response => this.saveSession(response))
    );
  }
 
  // ─── Login ──────────────────────────────────────────────────────────────────
 
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, data).pipe(
      tap(response => this.saveSession(response))
    );
  }
 
  // ─── Logout ─────────────────────────────────────────────────────────────────
 
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/auth/login']);
  }
 
  // ─── Helpers ────────────────────────────────────────────────────────────────
 
  // Save token + user info after successful login/register
  private saveSession(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify({
      email: response.email,
      fullName: response.fullName,
      ageGroup: response.ageGroup,
      healthCondition: response.healthCondition
    }));
    this.isLoggedInSubject.next(true);
  }
 
  // Get the saved JWT token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
 
  // Get the saved user info
  getCurrentUser(): AuthResponse | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }
 
  // Check if a token exists (used on app startup)
  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
