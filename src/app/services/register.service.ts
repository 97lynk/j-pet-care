import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

export interface RegistrationResponse {
  registrationCode: string;
  prefectureName: string;
  locationName: string;
  timeSlotLabel: string;
  appointmentDate: string; // Comes as an ISO string
}

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private readonly BASE_API = `${environment.apiUrl}/public/vaccines`;

  constructor(private http: HttpClient) {}

  register(request: any): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.BASE_API}/register`, request);
  }

  cancelRegistration(registrationCode: string): Observable<void> {
    return this.http.post<void>(`${this.BASE_API}/cancel/${registrationCode}`, {});
  }
}
