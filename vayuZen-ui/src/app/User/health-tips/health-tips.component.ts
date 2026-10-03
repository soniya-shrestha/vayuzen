import { Component, HostListener, OnInit } from '@angular/core'; 
import { AqiData, AqiService } from '../services/aqi.service';
import { AuthService } from '../../auth/services/auth.service';
import { LocationService } from '../services/location.service';
import { HealthTipsResponse, HealthTipsService } from '../services/health-tips.service';
import { UserService } from '../services/user.service';

interface AqiLevel {
  range: string;
  label: string;
  color: string;
  bg: string;
  description: string;
}
 
interface Pollutant {
  name: string;
  full: string;
  safe: string;
  desc: string;
  color: string;
}
@Component({
  selector: 'app-health-tips',
  standalone: false,
  templateUrl: './health-tips.component.html',
  styleUrl: './health-tips.component.scss'
})
export class HealthTipsComponent implements OnInit {
 
  user: any;
  isLoading = true;
  errorMessage = '';
  data: HealthTipsResponse | null = null;
  activeTab: 'personalized' | 'general' | 'pollutants' = 'personalized'; 
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
 
  navItems = [
    { icon: 'ti-home',      label: 'Dashboard',  active: false, route: '/user/dashboard' },
    { icon: 'ti-chart-bar', label: 'AQI History', active: false, route: '/user/history'   },
    { icon: 'ti-heart',     label: 'Health Tips', active: true,  route: '/user/tips'       },
    { icon: 'ti-bell',      label: 'Alerts',      active: false, route: '/user/alerts'     },
  ];
 
  aqiLevels: AqiLevel[] = [
    { range: '0–20',   label: 'Good',          color: '#276749', bg: '#F0FFF4', description: 'Air quality is excellent. No health risks for anyone.' },
    { range: '21–40',  label: 'Fair',          color: '#276749', bg: '#F0FFF4', description: 'Acceptable. Very sensitive individuals may notice minor effects.' },
    { range: '41–60',  label: 'Moderate',      color: '#92400E', bg: '#FFFBEB', description: 'Sensitive groups should limit prolonged outdoor exposure.' },
    { range: '61–80',  label: 'Poor',          color: '#C05621', bg: '#FFFAF0', description: 'Increasing likelihood of health effects for everyone.' },
    { range: '81–100', label: 'Very Poor',     color: '#C53030', bg: '#FFF5F5', description: 'Everyone may experience serious health effects outdoors.' },
    { range: '100+',   label: 'Extremely Poor',color: '#7B341E', bg: '#FFF5F5', description: 'Health emergency — all outdoor activity should be avoided.' },
  ];
 
  pollutants: Pollutant[] = [
    { name: 'PM2.5', full: 'Fine Particulate Matter',   safe: '25 µg/m³',  color: '#C53030', desc: 'Microscopic particles smaller than 2.5 micrometers that penetrate deep into lung tissue and enter the bloodstream. Primary AQI driver in Kathmandu. Main sources: vehicle exhaust, brick kilns, open burning.' },
    { name: 'PM10',  full: 'Coarse Particulate Matter', safe: '50 µg/m³',  color: '#C05621', desc: 'Larger particles from road dust, construction activity, and unpaved roads. Irritates the eyes, nose, and upper respiratory tract. Common in Kathmandu during dry seasons.' },
    { name: 'NO₂',   full: 'Nitrogen Dioxide',          safe: '200 µg/m³', color: '#D69E2E', desc: 'Produced mainly by diesel vehicle exhaust and industrial combustion. Inflames the lining of the airways and worsens asthma. Highest along Kathmandu Ring Road during peak hours.' },
    { name: 'SO₂',   full: 'Sulphur Dioxide',           safe: '350 µg/m³', color: '#6B46C1', desc: 'Released from burning coal and diesel with high sulphur content. Causes respiratory tract irritation and contributes to acid rain affecting vegetation and water.' },
    { name: 'CO',    full: 'Carbon Monoxide',            safe: '10 mg/m³',  color: '#2D3748', desc: 'Colourless, odourless gas from incomplete combustion. Binds to haemoglobin and reduces the blood\'s ability to carry oxygen, causing headaches and fatigue at elevated levels.' },
    { name: 'O₃',    full: 'Ground-level Ozone',         safe: '100 µg/m³', color: '#2B6CB0', desc: 'Not directly emitted — forms when NOx and VOCs react with sunlight. Peaks on warm sunny afternoons. Irritates airways, causes coughing, and reduces lung function over time.' },
  ];
 
  constructor(
    private authService:     AuthService,
    private healthTipsService: HealthTipsService,
    private userService: UserService
  ) {}
 
  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadTips();
  }
 
  loadTips(): void {
    this.isLoading    = true;
    this.errorMessage = '';
 
    // Single API call — Spring Boot handles AQI + ML + Flask tips
    this.healthTipsService.getTips().subscribe({
      next: (data) => {
        this.data      = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load health tips. Please try again.';
        this.isLoading    = false;
      }
    });
  }
 
  // Priority badge styling
  priorityColor(priority: string): string {
    return { high: '#C53030', medium: '#C05621', low: '#276749' }[priority] || '#718096';
  }
 
  priorityBg(priority: string): string {
    return { high: '#FFF5F5', medium: '#FFFAF0', low: '#F0FFF4' }[priority] || '#F7FAFC';
  }
 
  priorityLabel(priority: string): string {
    return { high: 'High priority', medium: 'Moderate', low: 'General' }[priority] || priority;
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
 
  formatCondition(val: string): string {
    if (!val || val === 'NONE') return 'No conditions';
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
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