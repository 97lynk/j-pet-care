export interface CustomerInfo {
  fullName: string;
  furigana: string;
  phoneNumber: string;
  email: string;
  postalCode: string;
  prefecture: string;
  municipality: string;
  address: string;
  building: string;
}

export interface PetInfo {
  petName: string;
  petType: string;
  breed: string;
  size: string;
  birthDate: string;
  gender: string;
  furColor: string;
  weight: number;
}

export interface VaccineProduct {
  displayNameJp: string;
  descriptionJp: string;
}

export interface VaccinationOrderItem {
  product: VaccineProduct;
  quantity: number;
  price: number;
  total: number;
}

export interface VaccinationOrder {
  petInfo: PetInfo;
  vaccinationOrderItems: VaccinationOrderItem[];
}

export interface AppointmentDetailResponse {
  prefectureName: string;
  locationName: string;
  timeSlotLabel: string;
  appointmentDate: string;
  dayOfWeek: string;
  venue: string;
  address: string;
  phone: string;
  hospital: string;
}
