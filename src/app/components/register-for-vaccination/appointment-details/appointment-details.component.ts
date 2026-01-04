import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {AppointmentConfigService} from '../../../services/appointment-config.service';
import {AppointmentLocation, AppointmentPrefecture, AppointmentTimeSlot} from 'src/app/models/appointment.model';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatRadioModule} from '@angular/material/radio';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MatCardModule} from '@angular/material/card';
import {MatNativeDateModule} from '@angular/material/core';
import {MatInput} from "@angular/material/input";

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatRadioModule,
    TranslateModule,
    MatCardModule,
    MatNativeDateModule,
    MatInput,
  ]
})
export class AppointmentDetailsComponent implements OnInit {

  @Input() form!: AbstractControl | null;
  minDate = new Date();

  prefectures: AppointmentPrefecture[] = [];
  filteredLocations: AppointmentLocation[] = [];
  currentTimeSlots: AppointmentTimeSlot[] = [];

  constructor(private appointmentConfigService: AppointmentConfigService) { }

  ngOnInit(): void {
    this.appointmentConfigService.getPrefectures().subscribe(data => {
      this.prefectures = data;
    });
  }

  get appointmentForm(): FormGroup {
    return this.form as FormGroup;
  }

  onPrefectureChange(prefectureId: number): void {
    this.form?.get('locationId')?.reset();
    this.form?.get('timeSlotId')?.reset();
    this.filteredLocations = [];
    this.currentTimeSlots = [];

    const selectedPrefecture = this.prefectures.find(p => p.id === prefectureId);
    if (selectedPrefecture) {
      this.appointmentConfigService.getLocations(selectedPrefecture.code).subscribe(data => {
        this.filteredLocations = data;
      });
    }
  }

  onLocationChange(locationId: number): void {
    this.form?.get('timeSlotId')?.reset();
    this.currentTimeSlots = [];

    const selectedLocation = this.filteredLocations.find(loc => loc.id === locationId);
    if (selectedLocation && selectedLocation.timeSlots) {
      this.currentTimeSlots = Array.from(selectedLocation.timeSlots);
      if (this.currentTimeSlots.length > 0) {
        this.form?.get('timeSlotId')?.setValue(this.currentTimeSlots[0].id);
      }
    }
  }

  get selectedPrefecture(): AppointmentPrefecture | undefined {
    const id = this.appointmentForm.get('prefectureId')?.value;
    return this.prefectures.find(p => p.id === id);
  }

  get selectedLocation(): AppointmentLocation | undefined {
    const id = this.appointmentForm.get('locationId')?.value;
    return this.filteredLocations.find(l => l.id === id);
  }

  get selectedTimeSlot(): AppointmentTimeSlot | undefined {
    const id = this.appointmentForm.get('timeSlotId')?.value;
    return this.currentTimeSlots.find(t => t.id === id);
  }
}
