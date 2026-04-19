import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable, of} from 'rxjs';
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

export interface RegistrationDetailsResponse extends RegistrationResponse {
  editJwt?: string;
  editLocked: boolean;
  editLockedReason?: string;
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

  getRegistrationDetails(registrationCode: string, phoneNumber: string, otp: string): Observable<RegistrationDetailsResponse> {
    return this.http.post<RegistrationDetailsResponse>(`${this.BASE_API}/view/${registrationCode}/details`, { phoneNumber, otp });
  }

  updateCustomer(regCode: string, body: object, jwt: string): Observable<void> {
    return this.http.put<void>(
      `${this.BASE_API}/view/${regCode}/customer`,
      body,
      { headers: new HttpHeaders({ Authorization: `Bearer ${jwt}` }) }
    );
  }

  updatePet(regCode: string, orderId: number, body: object, jwt: string): Observable<void> {
    return this.http.put<void>(
      `${this.BASE_API}/view/${regCode}/orders/${orderId}/pet`,
      body,
      { headers: new HttpHeaders({ Authorization: `Bearer ${jwt}` }) }
    );
  }

  deleteOrder(regCode: string, orderId: number, jwt: string): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_API}/view/${regCode}/orders/${orderId}`,
      { headers: new HttpHeaders({ Authorization: `Bearer ${jwt}` }) }
    );
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
