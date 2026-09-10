import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [ 
   {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then(m => m.AuthModule)
  }, 
   {
    path: 'user',
    loadChildren: () =>
      import('./User/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]   // ← protect all /user/* routes
  }, 
  { path: 'dashboard', redirectTo: 'user/dashboard' },
 
  {
    path: '**',
    redirectTo: 'auth/login'
  }
  

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
