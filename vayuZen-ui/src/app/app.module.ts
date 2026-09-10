import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { DashboardComponent } from './User/dashboard/dashboard.component';


@NgModule({
  declarations: [
    AppComponent,
   
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule, 
    HttpClientModule, 
  
  ],
  providers: [
 {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true           // multi: true means other interceptors can also exist
    }  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
