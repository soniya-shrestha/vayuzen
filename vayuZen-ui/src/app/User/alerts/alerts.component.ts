import { Component, HostListener, OnInit } from '@angular/core'; 
import { AqiData, AqiService } from '../services/aqi.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserService } from '../services/user.service';


interface Alert {
  id: number;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
} 

@Component({
  selector: 'app-alerts',
  standalone: false,
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit {
 
  user: any;
  aqiData: AqiData | null = null;
  isLoading = true; 
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
 
  // User's custom thresholds (editable)
  thresholds = {
    aqi:  100,
    pm25: 55,
    pm10: 100,
  };
 
  editingThresholds = false;
  savedMsg = '';
 
  navItems = [
    { icon: 'ti-home',      label: 'Dashboard',  active: false, route: '/user/dashboard' },
    { icon: 'ti-chart-bar', label: 'AQI History', active: false, route: '/user/history'   },
    { icon: 'ti-heart',     label: 'Health Tips', active: false, route: '/user/tips'       },
    { icon: 'ti-bell',      label: 'Alerts',      active: true,  route: '/user/alerts'     },
  ];
 
  constructor(
    private authService: AuthService,
    private aqiService: AqiService,
    private userService: UserService
  ) {}
 
  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadThresholds();
    this.aqiService.getCurrentAqi().subscribe({
      next: (data) => { this.aqiData = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }
 
  // ─── Threshold Management ──────────────────────────────────────────────────
 
  loadThresholds(): void {
    const saved = localStorage.getItem('vayuzen_thresholds');
    if (saved) this.thresholds = JSON.parse(saved);
  }
 
  saveThresholds(): void {
    localStorage.setItem('vayuzen_thresholds', JSON.stringify(this.thresholds));
    this.editingThresholds = false;
    this.savedMsg = 'Thresholds saved!';
    setTimeout(() => this.savedMsg = '', 3000);
  }
 
  // ─── Generated Alerts ─────────────────────────────────────────────────────
 
  get activeAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const aqi   = this.aqiData?.aqi   || 0;
    const pm25  = this.aqiData?.pm25  || 0;
    const pm10  = this.aqiData?.pm10  || 0;
    const risk  = this.aqiData?.riskLevel || 'Low';
    const c     = this.user?.healthCondition;
    const age   = this.user?.ageGroup;
 
    // AQI threshold alert
    if (aqi > this.thresholds.aqi) {
      alerts.push({
        id: 1, type: 'danger',
        title: `AQI exceeds your threshold of ${this.thresholds.aqi}`,
        message: `Current AQI is ${aqi} — ${aqi - this.thresholds.aqi} points above your set limit. Reduce outdoor exposure.`,
        time: 'Now', read: false
      });
    }
 
    // PM2.5 threshold alert
    if (pm25 > this.thresholds.pm25) {
      alerts.push({
        id: 2, type: 'warning',
        title: `PM2.5 is ${pm25} µg/m³ — above your threshold`,
        message: `Fine particles are at ${pm25} µg/m³, exceeding your limit of ${this.thresholds.pm25} µg/m³. Wear an N95 mask outdoors.`,
        time: 'Now', read: false
      });
    }
 
    // PM10 threshold
    if (pm10 > this.thresholds.pm10) {
      alerts.push({
        id: 3, type: 'warning',
        title: `PM10 elevated at ${pm10} µg/m³`,
        message: `Coarse particles exceed your threshold. People with respiratory conditions should be cautious.`,
        time: 'Now', read: false
      });
    }
 
    // ML risk-based alerts
    if (risk === 'Very High') {
      alerts.push({
        id: 4, type: 'danger',
        title: 'AI model predicts VERY HIGH health risk',
        message: 'Based on your health profile and current air quality, your personal health risk is very high. Stay indoors.',
        time: 'Now', read: false
      });
    } else if (risk === 'High') {
      alerts.push({
        id: 5, type: 'warning',
        title: 'AI model predicts HIGH health risk for your profile',
        message: 'The Random Forest model rates today\'s air quality as high risk for your age group and health condition.',
        time: 'Now', read: false
      });
    }
 
    // Condition-specific
    if ((c === 'ASTHMA' || c === 'RESPIRATORY') && aqi > 60) {
      alerts.push({
        id: 6, type: 'danger',
        title: 'Asthma/respiratory alert',
        message: 'Current air quality is likely to trigger respiratory symptoms. Keep your inhaler nearby and avoid outdoor exercise.',
        time: 'Now', read: false
      });
    }
 
    if (c === 'HEART_DISEASE' && aqi > 80) {
      alerts.push({
        id: 7, type: 'danger', 
        title: 'Cardiovascular health alert',
        message: 'High pollution levels increase cardiovascular stress. Monitor for chest discomfort or unusual fatigue.',
        time: 'Now', read: false
      });
    }
 
    if (age === 'ELDERLY' && aqi > 50) {
      alerts.push({
        id: 8, type: 'warning',
        title: 'Elderly advisory',
        message: 'Older adults are more vulnerable to air pollution. Limit outdoor time and avoid strenuous activity.',
        time: 'Now', read: false
      });
    }
 
    if (age === 'CHILD' && aqi > 50) {
      alerts.push({
        id: 9, type: 'warning',
        title: 'Children\'s health advisory',
        message: 'Keep outdoor playtime limited. Children\'s lungs are more susceptible to pollution damage.',
        time: 'Now', read: false
      });
    }
 
    // All clear
    if (alerts.length === 0) {
      alerts.push({
        id: 10, type: 'info', 
        title: 'All clear — air quality is within safe limits',
        message: `Current AQI is ${aqi}, well within your thresholds. Enjoy outdoor activities today!`,
        time: 'Now', read: false
      });
    }
 
    return alerts;
  }
 
  get alertCount(): number {
    return this.activeAlerts.filter(a => a.type !== 'info').length;
  }
 
  get userInitials(): string {
    if (!this.user?.fullName) return '?';
    return this.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }
 
  formatAgeGroup(val: string): string {
    const map: Record<string, string> = {
      CHILD: 'Child (under 12)', YOUNG_ADULT: 'Young Adult (12–35)',
      ADULT: 'Adult (35–60)', ELDERLY: 'Elderly (60+)'
    };
    return map[val] || val;
  } 
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

  logout(): void {
    this.authService.logout();
  }

}