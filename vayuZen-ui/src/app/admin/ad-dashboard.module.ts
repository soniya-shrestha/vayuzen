import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Routes } from '@angular/router';
import { AdDashboardComponent } from './ad-dashboard/ad-dashboard.component';
import { FormsModule } from '@angular/forms';


const routes: Routes = [
  { path: 'dashboard', component: AdDashboardComponent }
];


@NgModule({
  declarations: [ 
     AdDashboardComponent
  ],
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule

  ]
})
export class AdDashboardModule { }
