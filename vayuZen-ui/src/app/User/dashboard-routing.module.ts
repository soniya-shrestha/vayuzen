import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AqiHistoryComponent } from './aqi-history/aqi-history.component';
import { HealthTipsComponent } from './health-tips/health-tips.component';
import { AlertsComponent } from './alerts/alerts.component';

const routes: Routes = [ 
  { path: 'dashboard', component: DashboardComponent } ,
  { path: 'history', component: AqiHistoryComponent }, 
  { path: 'tips',      component: HealthTipsComponent },
  { path: 'alerts',    component: AlertsComponent     },
  { path: '',          redirectTo: 'dashboard', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
