import {Component, OnInit} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import moment from 'moment';
import {ProductService} from '../../services/product.service';
import {DisplayProductDto, VaccineProductDto} from '../../models/product/product.dto';
import {RegisterService} from '../../services/register.service';
import {MatStepper, MatStepperModule} from '@angular/material/stepper';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {CommonModule, DatePipe} from '@angular/common';
import {CustomerInfoFormComponent} from './customer-info-form/customer-info-form.component';
import {PetInfoFormComponent} from './pet-info-form/pet-info-form.component';
import {VaccineComboFormComponent} from './vaccine-combo-form/vaccine-combo-form.component';
import {VaccineIndividualFormComponent} from './vaccine-individual-form/vaccine-individual-form.component';
import {RegisterSuccessComponent} from './register-success/register-success.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';

@Component({
  selector: 'app-register-for-vaccination',
  templateUrl: './register-for-vaccination.component.html',
  styleUrls: ['./register-for-vaccination.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatStepperModule,
    MatButtonToggleModule,
    CustomerInfoFormComponent,
    PetInfoFormComponent,
    VaccineComboFormComponent,
    VaccineIndividualFormComponent,
    RegisterSuccessComponent,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  providers: [DatePipe]
})
export class RegisterForVaccinationComponent implements OnInit {

  total = 0;
  finalRegistrationCode: string | null = null;
  finalAppointmentDetails: string | null = null;

  customerInfoForm = this.fb.group({
    fullName: ['', Validators.required],
    furigana: ['', Validators.required],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{3}-?\d{4}$/)]],
    prefecture: ['', Validators.required],
    municipality: ['', Validators.required],
    address: ['', Validators.required],
    building: [''],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    appointment: this.fb.group({
      prefectureId: [null, Validators.required],
      locationId: [null, Validators.required],
      timeSlotId: [null, Validators.required],
      appointmentDate: [moment().add(1, 'day').toDate(), Validators.required],
    }),
  });

  comboProducts: DisplayProductDto[] = [];
  singleProducts: DisplayProductDto[] = [];
  singleProductPrice: { [key: number]: number } = {}; // Use productId as key

  petInfoForms: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private registerService: RegisterService,
    private datePipe: DatePipe
  ) {
    this.petInfoForms = this.fb.group({
      pets: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.pets.valueChanges.subscribe(() => {
      this.recalculateTotal();
    });

    this.productService.getAllProduct().subscribe((products: VaccineProductDto[]) => {
      const comboProducts: VaccineProductDto[] = [];
      const singleProducts: VaccineProductDto[] = [];

      products.forEach(product => {
        if (product.isCombo) {
          comboProducts.push(product);
        } else {
          singleProducts.push(product);
        }
      });

      this.comboProducts = this.populateRowspan(comboProducts, 'productCode');
      this.singleProducts = this.populateRowspan(singleProducts, 'productCode');
      this.singleProducts.forEach(product => this.singleProductPrice[product.productId] = product.price);

      this.addPet();
    });
  }

  populateRowspan(data: VaccineProductDto[], column: keyof VaccineProductDto): DisplayProductDto[] {
    const map = this.computeRowspan(data, column);
    const result: DisplayProductDto[] = [];
    const processedKeys = new Set<string>();

    data.forEach(product => {
      const key = product[column] as string;
      let rowspan = 0;
      if (!processedKeys.has(key)) {
        rowspan = map.get(key) || 0;
        processedKeys.add(key);
      }

      result.push({
        ...product,
        rowspan: { productCode: rowspan },
      });
    });
    return result;
  }

  computeRowspan(data: VaccineProductDto[], column: keyof VaccineProductDto): Map<string, number> {
    const map = new Map<string, number>();
    data.forEach(row => {
      const key = row[column] as string;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }

  get pets(): FormArray {
    return this.petInfoForms.get('pets') as FormArray;
  }

  // Helper methods for the template
  getPetControl(index: number, controlName: string): AbstractControl | null {
    return this.pets.at(index)?.get(controlName) ?? null;
  }

  getPetFormGroup(index: number, controlName: string): FormGroup | null {
    return this.pets.at(index)?.get(controlName) as FormGroup | null;
  }

  createPetGroup(): FormGroup {
    const selectVaccineControls = Object.fromEntries(
      this.singleProducts.map(p => [p.productId, [{
        value: false,
        disabled: !(p.petSize === 'ALL'),
      }]])
    );
    const amountVaccineControls = Object.fromEntries(
      this.singleProducts.map(p => [p.productId, [{ value: 0, disabled: true }, [Validators.min(1), Validators.max(12)]]])
    );

    return this.fb.group({
      petType: ['DOG', Validators.required],
      petName: ['', Validators.required],
      petBreed: ['', Validators.required],
      birthDate: [moment().toDate(), Validators.required],
      gender: ['male', Validators.required],
      furColor: ['', Validators.required],
      weight: ['', Validators.required],
      size: ['SMALL', Validators.required],
      healthStatus: this.fb.group({
        healthy: [false],
        eatingWell: [false],
        digestionGood: [false],
      }),
      healthCommitment: [true, Validators.requiredTrue],
      comboVaccine: [null], // This will hold the product object
      individualVaccineSelection: this.fb.group(selectVaccineControls),
      individualVaccineAmount: this.fb.group(amountVaccineControls),
    });
  }

  addPet(): void {
    this.pets.push(this.createPetGroup());
  }

  removePet(index: number): void {
    if (this.pets.length > 1) {
      this.pets.removeAt(index);
    }
  }

  onSubmitCustomerInfo($event: any, stepper: any): void {
    if (this.customerInfoForm.valid) {
      stepper.next();
    }
  }

  onSubmitPetInfo(stepper: MatStepper): void {
    if (this.customerInfoForm.valid && this.petInfoForms.valid) {
      this.registerVaccine(stepper);
    }
  }

  registerVaccine(stepper: MatStepper): void {
    const rawPetInfos = this.petInfoForms.getRawValue().pets;
    const petInfos = rawPetInfos.map((pet: any) => {
      const individualVaccineAmount: { [key: number]: number } = {};
      Object.keys(pet.individualVaccineSelection).forEach(productIdStr => {
        const productId = Number(productIdStr);
        if (pet.individualVaccineSelection[productId] && pet.individualVaccineAmount[productId] > 0) {
          individualVaccineAmount[productId] = pet.individualVaccineAmount[productId];
        }
      });

      return {
        ...pet,
        comboVaccine: pet.comboVaccine ? pet.comboVaccine.productId : null,
        individualVaccineAmount: individualVaccineAmount,
        individualVaccineSelection: undefined, // Remove from final payload
      };
    });

    const request = {
      customerInfo: this.customerInfoForm.getRawValue(),
      petInfos: petInfos,
    };

    this.registerService.register(request).subscribe(response => {
      const date = this.datePipe.transform(response.appointmentDate, 'mediumDate');

      this.finalRegistrationCode = response.registrationCode;
      this.finalAppointmentDetails = `${response.prefectureName} ${response.locationName} - ${date} - ${response.timeSlotLabel}`;

      stepper.next(); // Move to the success step
    });
  }

  recalculateTotal(): void {
    let total = 0;
    const pets = this.petInfoForms.getRawValue().pets;
    for (const pet of pets) {
      total += (pet.comboVaccine?.price || 0) +
        this.getIndividualVaccinesPrice(pet.individualVaccineSelection, pet.individualVaccineAmount);
    }
    this.total = total;
  }

  getIndividualVaccinesPrice(individualVaccineSelection: any, individualVaccineAmount: any): number {
    let total = 0;
    Object.keys(individualVaccineSelection)
      .filter((key) => individualVaccineSelection[key])
      .forEach((key: any) => {
        const productId = Number(key);
        total += this.singleProductPrice[productId] * individualVaccineAmount[productId];
      });
    return total;
  }
}
