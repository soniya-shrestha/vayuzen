import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Routes } from '@angular/router';


import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AqiHistoryComponent } from './aqi-history/aqi-history.component';
import { LocationModalComponent } from './location-modal/location-modal.component';
import { FormsModule } from '@angular/forms';
import { HealthTipsComponent } from './health-tips/health-tips.component';
import { AlertsComponent } from './alerts/alerts.component';




@NgModule({
  declarations: [ 
     DashboardComponent,
     AqiHistoryComponent,
     LocationModalComponent,
     HealthTipsComponent,
     AlertsComponent
  ],
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    DashboardRoutingModule,

  ]
})
export class DashboardModule { }
