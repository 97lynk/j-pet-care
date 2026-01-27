export interface VaccineMixtureDto {
  mixtureId: number;
  quantityPerUnit: number;
}

export interface ValidationDto {
  minAmount: number;
  maxAmount: number;
}

export interface VaccineProductDto {
  productId: number;
  productCode: string;
  petSize: string;
  price: number;
  displayNameJp: string;
  displayNameEn: string;
  descriptionJp?: string;
  descriptionEn?: string;
  isCombo: boolean;
  priority: number;
  validations: ValidationDto;
  mixtures: VaccineMixtureDto[];
}

/**
 * Represents a product prepared for display in the template,
 * including the calculated rowspan for table rendering.
 */
export interface DisplayProductDto extends VaccineProductDto {
  rowspan: {
    productCode: number;
  };
}
