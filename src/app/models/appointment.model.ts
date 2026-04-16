export interface AppointmentTimeSlot {
  id: number;
  code: string;
  label: string;
  type: string;
}

export interface AppointmentLocation {
  id: number;
  name: string;
  address: string;
  phone: string;
  hospital: string;
  date: string;
  dayOfWeek: string;
  venue: string;
  timeSlots: AppointmentTimeSlot[];
}

export interface AppointmentPrefecture {
  id: number;
  name: string;
  code: string;
}
