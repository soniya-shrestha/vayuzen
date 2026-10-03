import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { AdminService, AdminStats, UserSummary } from '../services/admin.service';


type AdminTab = 'overview' | 'users';

interface NavItem {
  icon: string;
  label: string;
  tab: AdminTab;
}

@Component({
  selector: 'app-ad-dashboard',
  standalone: false,
  templateUrl: './ad-dashboard.component.html',
  styleUrl: './ad-dashboard.component.scss'
})
export class AdDashboardComponent implements OnInit {

  user: any;
  stats: AdminStats | null = null;
  users: UserSummary[] = [];
  filteredUsers: UserSummary[] = [];
  isLoadingStats = true;
  isLoadingUsers = true;
  searchQuery = '';
  activeTab: 'overview' | 'users' = 'overview';
  showDeleteModal = false;
  userToDelete: UserSummary | null = null;
  deleteLoading = false;
  deleteError = '';
  successMsg = '';

  navItems: NavItem[] =  [
    { icon: 'ti-layout-dashboard', label: 'Overview',  tab: 'overview' },
    { icon: 'ti-users',            label: 'Manage Users', tab: 'users' },
  ];

  constructor(
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadStats();
    this.loadUsers();
  }

  loadStats(): void {
    this.isLoadingStats = true;
    this.adminService.getStats().subscribe({
      next: (data) => { this.stats = data; this.isLoadingStats = false; },
      error: () => { this.isLoadingStats = false; }
    });
  }

  loadUsers(): void {
    this.isLoadingUsers = true;
    this.adminService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = data;
        this.isLoadingUsers = false;
      },
      error: () => { this.isLoadingUsers = false; }
    });
  }

  // Search filter
  onSearch(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.ageGroup.toLowerCase().includes(q) ||
      u.healthCondition.toLowerCase().includes(q)
    );
  }

  // Delete flow
  confirmDelete(user: UserSummary): void {
    this.userToDelete  = user;
    this.showDeleteModal = true;
    this.deleteError   = '';
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete  = null;
  }

  executeDelete(): void {
    if (!this.userToDelete) return;
    this.deleteLoading = true;
    this.deleteError   = '';

    this.adminService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.users         = this.users.filter(u => u.id !== this.userToDelete!.id);
        this.filteredUsers = this.filteredUsers.filter(u => u.id !== this.userToDelete!.id);
        this.showDeleteModal = false;
        this.userToDelete  = null;
        this.deleteLoading = false;
        this.successMsg    = 'User deleted successfully.';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.deleteError   = err.error?.message || 'Could not delete user. Please try again.';
        this.deleteLoading = false;
      }
    });
  }

  // Helpers
  get userInitials(): string {
    if (!this.user?.fullName) return 'A';
    return this.user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatCondition(val: string): string {
    if (!val || val === 'NONE') return 'None';
    return val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  formatAgeGroup(val: string): string {
    const map: Record<string, string> = {
      CHILD: 'Child', YOUNG_ADULT: 'Young Adult',
      ADULT: 'Adult', ELDERLY: 'Elderly'
    };
    return map[val] || val;
  }

  aqiLevelClass(level: string): string {
    const map: Record<string, string> = {
      Low: 'level-low', Moderate: 'level-moderate',
      High: 'level-high', 'Very High': 'level-very-high'
    };
    return map[level] || '';
  }

   setTab(tab: AdminTab): void {
    this.activeTab = tab;
  }

  logout(): void {
    this.authService.logout();
  }
}
