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

  getLocations(prefectureCode: string): Observable<AppointmentLocation[]> {
    return this.http.get<AppointmentLocation[]>(`${this.apiUrl}/prefectures/${prefectureCode}/locations`);
  }
}
