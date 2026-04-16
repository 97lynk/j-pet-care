import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {AppointmentLocation, AppointmentPrefecture} from '../models/appointment.model';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentConfigService {

  private apiUrl = `${environment.apiUrl}/public/appointments`;

  constructor(private http: HttpClient) { }

  getPrefectures(): Observable<AppointmentPrefecture[]> {
    return this.http.get<AppointmentPrefecture[]>(`${this.apiUrl}/prefectures`);
  }

  getLocations(prefectureId: number, timeSlotType?: string): Observable<AppointmentLocation[]> {
    let url = `${this.apiUrl}/prefectures/${prefectureId}/locations`;
    if (timeSlotType) {
      url += `?timeSlotType=${timeSlotType}`;
    }
    return this.http.get<AppointmentLocation[]>(url);
  }
}
