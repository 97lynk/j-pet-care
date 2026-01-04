import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

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

  private readonly API = 'http://localhost:8765/public/vaccines/register';

  constructor(private http: HttpClient) { }

  register(request: any): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(this.API, request);
  }
}
