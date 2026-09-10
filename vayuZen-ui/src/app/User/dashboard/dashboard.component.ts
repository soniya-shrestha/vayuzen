import { Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { AqiService, AqiData } from '../services/aqi.service';
import { LocationService } from '../services/location.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  user: any;
  isLoading = false;
  errorMessage = '';
  showLocationModal = false;
  currentLocation = 'Kathmandu, Nepal';
  showSettings = false;
  showChangePassword = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  cpLoading = false;
  cpSuccess = '';
  cpError = '';
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  aqiData: AqiData = {
    aqi: 0, pm25: 0, pm10: 0, no2: 0, co: 0, so2: 0, o3: 0,
    level: 'Low', description: '', updatedAt: '--:--',
    location: 'Kathmandu, Nepal', latitude: 27.7172, longitude: 85.3240,
    riskLevel: '...', confidence: 0, probabilities: {}, mlAvailable: false,
    recommendations: []
  };

  navItems = [
    { icon: 'ti-home', label: 'Dashboard', active: false, route: '/user/dashboard' },
    { icon: 'ti-chart-bar', label: 'AQI History', active: false, route: '/user/history' },
    { icon: 'ti-heart', label: 'Health Tips', active: false, route: '/user/tips' },
    { icon: 'ti-bell', label: 'Alerts', active: false, route: '/user/alerts' },
  ];

  constructor(
    private authService: AuthService,
    private aqiService: AqiService,
    private locationService: LocationService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    const cached = this.locationService.getCachedLocation(this.user?.email);
    if (cached) {
      this.currentLocation = cached.name;
      this.loadAqi();
    } else {
      this.showLocationModal = true;
    }
  }

  loadAqi(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.aqiService.getCurrentAqi().subscribe({
      next: (data) => {
        this.aqiData = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load air quality data.';
        this.isLoading = false;
      }
    });
  }

  refresh(): void { this.loadAqi(); }

  toggleSettings(event: Event): void {
    event.stopPropagation();
    this.showSettings = !this.showSettings;
  }

  // Close dropdown when clicking anywhere else on the page
  @HostListener('document:click')
  closeSettings(): void {
    this.showSettings = false;
  }

  // Open change password modal
  openChangePassword(): void {
    this.showSettings = false;
    this.showChangePassword = true;
    this.cpSuccess = '';
    this.cpError = '';
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  // Close modal when clicking the overlay background
  closeChangePassword(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showChangePassword = false;
    }
  }

  // Submit the change password form
  submitChangePassword(): void {
    this.cpError = '';
    this.cpSuccess = '';

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.cpError = 'All fields are required.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.cpError = 'New password must be at least 6 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.cpError = 'New passwords do not match.';
      return;
    }

    this.cpLoading = true;
    this.userService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.cpLoading = false;
        this.cpSuccess = 'Password updated successfully!';
        // Auto-close after 2 seconds
        setTimeout(() => { this.showChangePassword = false; }, 2000);
      },
      error: (err) => {
        this.cpLoading = false;
        this.cpError = err.error?.message || 'Current password is incorrect.';
      }
    });
  }


  // ─── Computed Helpers ──────────────────────────────────────────────────────

  get userInitials(): string {
    if (!this.user?.fullName) return '?';
    return this.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get firstName(): string {
    return this.user?.fullName?.split(' ')[0] || 'there';
  }

  get aqiClass(): string {
    const map: Record<string, string> = {
      'Low': 'level-low', 'Moderate': 'level-moderate',
      'High': 'level-high', 'Very High': 'level-very-high'
    };
    return map[this.aqiData.level] || 'level-low';
  }

  get pm25Percent(): number { return Math.min((this.aqiData.pm25 / 250) * 100, 100); }
  get pm10Percent(): number { return Math.min((this.aqiData.pm10 / 300) * 100, 100); }
  get no2Percent(): number { return Math.min((this.aqiData.no2 / 200) * 100, 100); }

  // ✅ Now uses REAL ML prediction from Flask instead of rule-based logic
  get healthRisk(): string {
    return this.aqiData.riskLevel || '...';
  }

  get healthRiskClass(): string {
    const map: Record<string, string> = {
      'Low': 'risk-low', 'Moderate': 'risk-moderate',
      'High': 'risk-high', 'Very High': 'risk-high'
    };
    return map[this.aqiData.riskLevel] || 'risk-low';
  }

  // Confidence as percentage string e.g. "87%"
  get confidencePercent(): string {
    return this.aqiData.confidence
      ? Math.round(this.aqiData.confidence * 100) + '%'
      : '—';
  }

  get recommendations() {
    return this.aqiData.recommendations || [];
  }

  formatCondition(val: string): string {
    if (!val || val === 'NONE') return 'None / Healthy';
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  formatAgeGroup(val: string): string {
    const map: Record<string, string> = {
      CHILD: 'Child (under 12)', YOUNG_ADULT: 'Young Adult (12–35)',
      ADULT: 'Adult (35–60)', ELDERLY: 'Elderly (60+)'
    };
    return map[val] || val;
  }

  onLocationSelected(loc: { lat: number; lon: number; name: string }): void {
    this.showLocationModal = false;
    this.currentLocation = loc.name;
    this.loadAqi();
  }

  changeLocation(): void {
    this.showLocationModal = true;
  }

  logout(): void { this.authService.logout(); }
}