import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { AqiHistoryPoint, AqiHistoryService } from '../services/aqi-history.service';
import { AuthService } from '../../auth/services/auth.service';
import { Chart, registerables } from 'chart.js';
import { UserService } from '../services/user.service';

Chart.register(...registerables);

@Component({
  selector: 'app-aqi-history',
  standalone: false,
  templateUrl: './aqi-history.component.html',
  styleUrl: './aqi-history.component.scss'
})
export class AqiHistoryComponent implements OnInit, AfterViewInit {

  @ViewChild('aqiChart') aqiChartRef!: ElementRef<HTMLCanvasElement>;

  user: any;
  isLoading = true;
  errorMessage = '';
  selectedRange = 7; // days
  history: AqiHistoryPoint[] = [];
  chart: Chart | null = null;
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

  // Quick stats computed from history
  avgAqi = 0;
  maxAqi = 0;
  minAqi = 0;
  trend: 'up' | 'down' | 'flat' = 'flat';

  rangeOptions = [
    { label: '24 Hours', value: 1 },
    { label: '7 Days', value: 7 },
    { label: '30 Days', value: 30 },
  ];

  navItems = [
    { icon: 'ti-home', label: 'Dashboard', active: false, route: '/user/dashboard' },
    { icon: 'ti-chart-bar', label: 'AQI History', active: true, route: '/user/history' },
    { icon: 'ti-heart', label: 'Health Tips', active: false, route: '/user/tips' },
    { icon: 'ti-bell', label: 'Alerts', active: false, route: '/user/alerts' },
  ];

  constructor(
    private historyService: AqiHistoryService,
    private authService: AuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
  }

  ngAfterViewInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.historyService.getHistory(this.selectedRange).subscribe({
      next: (data) => {
        this.history = data;
        this.computeStats();
        this.renderChart();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load AQI history.';
        this.isLoading = false;
      }
    });
  }

  changeRange(days: number): void {
    this.selectedRange = days;
    this.loadHistory();
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  private computeStats(): void {
    if (this.history.length === 0) {
      this.avgAqi = 0; this.maxAqi = 0; this.minAqi = 0; this.trend = 'flat';
      return;
    }

    const values = this.history.map(h => h.aqi);
    this.avgAqi = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    this.maxAqi = Math.max(...values);
    this.minAqi = Math.min(...values);

    // Trend: compare first half average to second half average
    const mid = Math.floor(values.length / 2);
    const firstHalf = values.slice(0, mid);
    const secondHalf = values.slice(mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);

    if (secondAvg > firstAvg + 5) this.trend = 'up';
    else if (secondAvg < firstAvg - 5) this.trend = 'down';
    else this.trend = 'flat';
  }

  get trendIcon(): string {
    return { up: 'ti-trending-up', down: 'ti-trending-down', flat: 'ti-minus' }[this.trend];
  }

  get trendColor(): string {
    // Rising AQI = worse air = red. Falling AQI = better air = green.
    return { up: '#E53E3E', down: '#38A169', flat: '#718096' }[this.trend];
  }

  get trendLabel(): string {
    return { up: 'Worsening', down: 'Improving', flat: 'Stable' }[this.trend];
  }

  // ─── Chart Rendering ──────────────────────────────────────────────────────

  private renderChart(): void {
    if (!this.aqiChartRef?.nativeElement) return;

    // Destroy previous chart instance before redrawing
    if (this.chart) {
      this.chart.destroy();
    }

    if (this.history.length === 0) return;

    const labels = this.history.map(h => h.timestamp);
    const aqiValues = this.history.map(h => h.aqi);
    const pm25Values = this.history.map(h => h.pm25);

    this.chart = new Chart(this.aqiChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'AQI',
            data: aqiValues,
            borderColor: '#0F4C5C',
            backgroundColor: 'rgba(15, 76, 92, 0.08)',
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#0F4C5C',
            tension: 0.3,
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'PM2.5',
            data: pm25Values,
            borderColor: '#38B6C8',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [4, 4],
            pointRadius: 2,
            pointBackgroundColor: '#38B6C8',
            tension: 0.3,
            fill: false,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F4C5C',
            padding: 10,
            titleFont: { size: 12 },
            bodyFont: { size: 12 },
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#E8F7F9' },
            ticks: { color: '#718096', font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: '#718096',
              font: { size: 10 },
              maxRotation: 45,
              autoSkip: true,
              maxTicksLimit: 8
            }
          }
        }
      }
    });
  }

  formatAgeGroup(val: string): string {
    const map: Record<string, string> = {
      CHILD: 'Child (under 12)', YOUNG_ADULT: 'Young Adult (12–35)',
      ADULT: 'Adult (35–60)', ELDERLY: 'Elderly (60+)'
    };
    return map[val] || val;
  }

  get userInitials(): string {
    if (!this.user?.fullName) return '?';
    return this.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
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
