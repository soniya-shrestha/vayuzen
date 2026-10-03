import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';


export interface HealthTip {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  body: string;
}

export interface HealthTipsResponse {
  aqi: number;
  pm25: number;
  riskLevel: string;
  confidence: number;
  location: string;
  updatedAt: string;
  personalizedTips: HealthTip[];
  generalTips: HealthTip[];
}

@Injectable({ providedIn: 'root' })
export class HealthTipsService {

  private readonly API_URL = `http://localhost:8080/api/tips`;

  constructor(private http: HttpClient) {}

  // GET /api/tips — Spring Boot handles everything:
  // AQI fetch + ML prediction + Flask tip generation
  getTips(): Observable<HealthTipsResponse> {
    return this.http.get<HealthTipsResponse>(this.API_URL).pipe(
      catchError(err => {
        console.error('Failed to fetch health tips:', err);
        return of(this.fallback());
      })
    );
  }

  private fallback(): HealthTipsResponse {
    return {
      aqi: 0, pm25: 0, riskLevel: 'Unknown',
      confidence: 0, location: 'Kathmandu, Nepal', updatedAt: '--:--',
      personalizedTips: [{
        category: 'General', priority: 'low',
        title: 'Unable to load personalized tips',
        body: 'Please check your connection and try again.'
      }],
      generalTips: []
    };
  }
}
