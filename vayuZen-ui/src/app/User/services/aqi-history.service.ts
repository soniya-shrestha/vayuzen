import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

 
export interface AqiHistoryPoint {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  level: string;
}
 
@Injectable({
  providedIn: 'root'
})
export class AqiHistoryService {
 
  // Was: private readonly API_URL = 'http://localhost:8080/api/aqi';
  private readonly API_URL = `http://localhost:8080/api`;
 
  constructor(private http: HttpClient) {}
 
  getHistory(days: number = 7): Observable<AqiHistoryPoint[]> {
    return this.http.get<AqiHistoryPoint[]>(`${this.API_URL}/history?days=${days}`).pipe(
      catchError(err => {
        console.error('Failed to fetch AQI history:', err);
        return of([]);
      })
    );
  }
}
