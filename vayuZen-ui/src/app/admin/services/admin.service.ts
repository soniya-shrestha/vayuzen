import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';

export interface UserSummary {
  id: number;
  fullName: string;
  email: string;
  ageGroup: string;
  healthCondition: string;
  role: string;
  locationName: string;
}

export interface AdminStats {
  totalUsers: number;
  totalAqiReadings: number;
  latestAqi: number;
  latestAqiLevel: string;
  latestAqiTime: string;
  modelAccuracy: number;
  modelVersion: string;
  trainingsamples: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService { 

  private readonly API_URL = `http://localhost:8080/api/admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.API_URL}/stats`).pipe(
      catchError(() => of({
        totalUsers: 0, totalAqiReadings: 0, latestAqi: 0,
        latestAqiLevel: 'Unknown', latestAqiTime: '--',
        modelAccuracy: 0, modelVersion: '--', trainingsamples: 0
      }))
    );
  }

  getAllUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${this.API_URL}/users`).pipe(
      catchError(() => of([]))
    );
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/${id}`);
  }
 
  
}
