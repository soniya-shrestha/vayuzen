import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { AqiService, AqiData } from '../services/aqi.service';

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
 
  aqiData: AqiData = {
    aqi: 0, pm25: 0, pm10: 0, no2: 0, co: 0, so2: 0, o3: 0,
    level: 'Low', description: '', updatedAt: '--:--',
    location: 'Kathmandu, Nepal', latitude: 27.7172, longitude: 85.3240,
    riskLevel: '...', confidence: 0, probabilities: {}, mlAvailable: false,
    recommendations: []
  };
 
  navItems = [
    { icon: 'ti-home',      label: 'Dashboard',  active: true  },
    { icon: 'ti-chart-bar', label: 'AQI History', active: false },
    { icon: 'ti-heart',     label: 'Health Tips', active: false },
    { icon: 'ti-map-pin',   label: 'Locations',   active: false },
    { icon: 'ti-bell',      label: 'Alerts',      active: false },
  ];
 
  constructor(
    private authService: AuthService,
    private aqiService: AqiService
  ) {}
 
  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadAqi();
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
  get no2Percent():  number { return Math.min((this.aqiData.no2  / 200) * 100, 100); }
 
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
 
  logout(): void { this.authService.logout(); }
}