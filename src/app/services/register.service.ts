import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {AppointmentDetailResponse, CustomerInfo, VaccinationOrder} from '../models/registration.model';


export interface RegistrationResponse {
  registrationCode: string;
  prefectureName: string;
  locationName: string;
  timeSlotLabel: string;
  appointmentDate: string;
  customerInfo: CustomerInfo;
  vaccinationOrders: VaccinationOrder[];
  appointmentInfo: AppointmentDetailResponse;
}

export interface VerificationResponse {
  status: string;
  target: string;
}

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private readonly BASE_API = `${environment.apiUrl}/public/vaccines`;
  private readonly VERIFICATION_API = `${environment.apiUrl}/public/verification`;

  constructor(private http: HttpClient) {}

  register(request: any): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.BASE_API}/register`, request);
  }

  sendCancellationOtp(registrationCode: string): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.BASE_API}/cancel/${registrationCode}/send-otp`, {});
  }

  confirmCancellation(registrationCode: string, otp: string): Observable<void> {
    return this.http.post<void>(`${this.BASE_API}/cancel/${registrationCode}/confirm`, { otp });
  }

  sendViewRegistrationOtp(registrationCode: string, phoneNumber: string): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(`${this.BASE_API}/view/${registrationCode}/send-otp`, { phoneNumber });
  }

  getRegistrationDetails(registrationCode: string, phoneNumber: string, otp: string): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.BASE_API}/view/${registrationCode}/details`, { phoneNumber, otp });
  }

  sendVerification(target: string, channel: string): Observable<VerificationResponse> {
    const params = new HttpParams()
      .set('target', target)
      .set('channel', channel);
    return this.http.post<VerificationResponse>(`${this.VERIFICATION_API}/send`, {}, { params });
  }

  verify(target: string, token: string): Observable<VerificationResponse> {
    const params = new HttpParams()
      .set('target', target)
      .set('token', token);
    return this.http.post<VerificationResponse>(`${this.VERIFICATION_API}/verify`, {}, { params });
  }
}
