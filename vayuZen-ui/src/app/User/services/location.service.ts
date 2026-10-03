import { Injectable } from '@angular/core'; 
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KathmanduArea {
  name: string;
  lat: number;
  lon: number;
}
 
// Well-known areas inside Kathmandu valley with accurate coordinates
export const KATHMANDU_AREAS: KathmanduArea[] = [
  { name: 'Thamel, Kathmandu',          lat: 27.7151, lon: 85.3123 },
  { name: 'Chabahil, Kathmandu',        lat: 27.7189, lon: 85.3477 },
  { name: 'Koteshwor, Kathmandu',       lat: 27.6854, lon: 85.3477 },
  { name: 'Balaju, Kathmandu',          lat: 27.7356, lon: 85.2984 },
  { name: 'Baneshwor, Kathmandu',       lat: 27.6939, lon: 85.3356 },
  { name: 'Kalanki, Kathmandu',         lat: 27.6939, lon: 85.2793 },
  { name: 'Kirtipur, Kathmandu',        lat: 27.6783, lon: 85.2793 },
  { name: 'Budhanilkantha, Kathmandu', lat: 27.7725, lon: 85.3617 },
  { name: 'Sankhu, Kathmandu',         lat: 27.7356, lon: 85.4534 }, 
   { name: 'Tokha, Kathmandu',           lat: 27.7592, lon: 85.3283 },
  { name: 'Nagarjun, Kathmandu',        lat: 27.7325, lon: 85.2567 },
  { name: 'Gokarneshwor, Kathmandu',    lat: 27.7333, lon: 85.3833 },
  { name: 'Dakshinkali, Kathmandu',     lat: 27.5833, lon: 85.2500 },
  { name: 'Naxal, Kathmandu',           lat: 27.7159, lon: 85.3278 },
];
 
@Injectable({ providedIn: 'root' })
export class LocationService {
 
  private readonly API_URL = `http://localhost:8080/api/user`;
 
  constructor(private http: HttpClient) {}
 
  // Ask browser for GPS location — returns a Promise
  detectLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        maximumAge: 300000  // cache for 5 minutes
      });
    });
  }
 
  // Save chosen location to backend (stored in users table)
  saveLocation(lat: number, lon: number, locationName: string): Observable<any> {
    return this.http.put(`${this.API_URL}/location`, { latitude: lat, longitude: lon, locationName });
  }
 
  // Find closest named area to given coordinates
  findClosestArea(lat: number, lon: number): KathmanduArea {
    let closest = KATHMANDU_AREAS[0];
    let minDist = Infinity;
 
    for (const area of KATHMANDU_AREAS) {
      const dist = Math.sqrt(
        Math.pow(area.lat - lat, 2) + Math.pow(area.lon - lon, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = area;
      }
    }
    return closest;
  }
 
  // Save to localStorage so we don't ask again on every page load
  cacheLocation(lat: number, lon: number, name: string, email: string): void {
  localStorage.setItem(`vayuzen_location_${email}`, JSON.stringify({ lat, lon, name }));
} 

  getCachedLocation(email: string): { lat: number; lon: number; name: string } | null {
  const cached = localStorage.getItem(`vayuzen_location_${email}`);
  return cached ? JSON.parse(cached) : null;
}
}