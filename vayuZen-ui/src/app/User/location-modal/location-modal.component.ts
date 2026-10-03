import { Component, EventEmitter, Output } from '@angular/core';
import { KATHMANDU_AREAS, KathmanduArea, LocationService } from '../services/location.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-location-modal',
  standalone: false,
  templateUrl: './location-modal.component.html',
  styleUrl: './location-modal.component.scss'
})
export class LocationModalComponent {
  @Output() locationSelected = new EventEmitter<{ lat: number; lon: number; name: string }>();

  isDetecting = false;
  showManual = false;
  errorMsg = '';
  areas = KATHMANDU_AREAS;
  selectedArea: KathmanduArea | null = null;

  constructor(private locationService: LocationService , private authService: AuthService) { } 

   private get userEmail(): string {
    return this.authService.getCurrentUser()?.email || '';
  }

  // User clicks "Use my location"
  async detectLocation(): Promise<void> {
    this.isDetecting = true;
    this.errorMsg = '';

    try {
      const position = await this.locationService.detectLocation();
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const closest = this.locationService.findClosestArea(lat, lon); 

      this.locationService.saveLocation(lat, lon, closest.name).subscribe({
        next: () => {
          this.locationService.cacheLocation(lat, lon, closest.name, this.userEmail);
          this.locationSelected.emit({ lat, lon, name: closest.name });
        },
        error: () => {
          this.errorMsg = 'Could not save your location. Please try again.';
        }
      });

    } catch (err) {
      this.errorMsg = 'Could not detect location. Please select your area manually.';
      this.showManual = true;
    } finally {
      this.isDetecting = false;
    }
}
  // User picks from dropdown
  selectManual(): void {
    if (!this.selectedArea) return;
    const { lat, lon, name } = this.selectedArea;

    this.locationService.saveLocation(lat, lon, name).subscribe({
      next: () => {
        this.locationService.cacheLocation(lat, lon, name, this.userEmail);
        this.locationSelected.emit({ lat, lon, name });
      },
      error: () => {
        this.errorMsg = 'Could not save your location. Please try again.';
      }
    });
}

  showManualPicker(): void {
    this.showManual = true;
  }
}