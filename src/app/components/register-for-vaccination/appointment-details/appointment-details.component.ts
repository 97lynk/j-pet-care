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
import {MatInputModule} from "@angular/material/input";
import {MatButtonToggleModule} from "@angular/material/button-toggle";

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
    MatInputModule,
    MatButtonToggleModule
  ]
})
export class AppointmentDetailsComponent implements OnInit {

  @Input() form!: AbstractControl | null;

  prefectures: AppointmentPrefecture[] = [];
  filteredLocations: AppointmentLocation[] = [];
  groupedLocations: { date: string, locations: AppointmentLocation[] }[] = [];
  currentTimeSlots: AppointmentTimeSlot[] = [];
  timeSlotType: string | undefined = 'MORNING'; // Initialize to MORNING

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
    this.groupedLocations = [];
    this.currentTimeSlots = [];
    this.loadLocations(prefectureId, this.timeSlotType);
  }

  onTimeSlotTypeChange(type: string): void {
    this.timeSlotType = type;
    const prefectureId = this.appointmentForm.get('prefectureId')?.value;
    if (prefectureId) {
      this.loadLocations(prefectureId, this.timeSlotType);
    }
  }

  private loadLocations(prefectureId: number, timeSlotType?: string): void {
    this.appointmentConfigService.getLocations(prefectureId, timeSlotType).subscribe(data => {
      this.filteredLocations = data;
      this.groupLocationsByDate();
    });
  }

  private groupLocationsByDate(): void {
    const groups = this.filteredLocations.reduce((acc, location) => {
      const date = location.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(location);
      return acc;
    }, {} as { [key: string]: AppointmentLocation[] });

    this.groupedLocations = Object.keys(groups).map(date => {
      return {
        date: date,
        locations: groups[date]
      };
    });
  }

  onLocationChange(locationId: number): void {
    this.form?.get('timeSlotId')?.reset();
    this.currentTimeSlots = [];

    const selectedLocation = this.filteredLocations.find(loc => loc.id === locationId);
    if (selectedLocation && selectedLocation.timeSlots) {
      this.currentTimeSlots = Array.from(selectedLocation.timeSlots);

      // Auto-select time slot based on type or default to first
      if (this.currentTimeSlots.length > 0) {
        let slotToSelect = this.currentTimeSlots[0];

        if (this.timeSlotType && this.timeSlotType !== 'ALLDAY') {
           const matchingSlot = this.currentTimeSlots.find(slot => slot.type === this.timeSlotType);
           if (matchingSlot) {
             slotToSelect = matchingSlot;
           }
        }

        this.form?.get('timeSlotId')?.setValue(slotToSelect.id);
      }
    }
  }

  onTimeSlotChange(): void {
    // This method is intentionally left empty.
    // Its purpose is to trigger change detection when the radio button selection changes.
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
