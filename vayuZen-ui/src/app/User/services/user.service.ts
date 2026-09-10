import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly API_URL = `http://localhost:8080/api/user`;
 
  constructor(private http: HttpClient) {}
 
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.API_URL}/change-password`, {
      currentPassword,
      newPassword
    });
  } 
}
