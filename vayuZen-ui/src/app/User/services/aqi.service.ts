import { Injectable } from '@angular/core';  
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs'; 

export interface Recommendation {
  color: string;
  icon: string;
  title: string;
  body: string;
}

export interface AqiData {
  // Open-Meteo fields
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  co: number;
  so2: number;
  o3: number;
  level: 'Low' | 'Moderate' | 'High' | 'Very High' | 'Unknown';
  description: string;
  updatedAt: string;
  location: string;
  latitude: number;
  longitude: number;
 
  // ML prediction fields (from Flask via Spring Boot)
  riskLevel: string;       // "Low", "Moderate", "High", "Very High"
  confidence: number;      // 0.0 to 1.0
  probabilities: {         // breakdown: { "Low": 0.02, "High": 0.87, ... }
    Low?: number;
    Moderate?: number;
    High?: number;
    'Very High'?: number;
  };
  mlAvailable: boolean;    // false if Flask was down and fallback was used 
  recommendations: Recommendation[];
}
 
@Injectable({
  providedIn: 'root'
})
export class AqiService {
 
  private readonly API_URL = 'http://localhost:8080/api';
 
  constructor(private http: HttpClient) {}
 
  // GET /api/aqi/current
  // AuthInterceptor automatically attaches the JWT token
  getCurrentAqi(): Observable<AqiData> {
    return this.http.get<AqiData>(`${this.API_URL}/current`).pipe(
      catchError(err => {
        console.error('Failed to fetch AQI:', err);
        return of(this.fallback());
      })
    );
  }
 
  private fallback(): AqiData {
    return {
      aqi: 0, pm25: 0, pm10: 0, no2: 0, co: 0, so2: 0, o3: 0,
      level: 'Unknown',
      description: 'Unable to load air quality data.',
      updatedAt: '--:--',
      location: 'Kathmandu, Nepal',
      latitude: 27.7172, longitude: 85.3240,
      riskLevel: 'Unknown',
      confidence: 0,
      probabilities: {},
      mlAvailable: false,
      recommendations: [{
        color: '#718096', icon: '⚠️',
        title: 'Data unavailable',
        body: 'Could not connect to the server. Please check your connection.'
      }]
    };
  }
}