import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
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
import {MatError} from "@angular/material/input";
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Subject, takeUntil} from "rxjs";
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {KitTestFormComponent} from "./kit-test-form/kit-test-form.component";

export function requireVaccineSelection(control: AbstractControl): ValidationErrors | null {
  const comboVaccine = control.get('comboVaccine');
  const individualVaccineSelection = control.get('individualVaccineSelection');

  const hasCombo = comboVaccine && comboVaccine.value;
  const hasIndividual = individualVaccineSelection && Object.values(individualVaccineSelection.value).some(v => v);

  if (hasCombo && hasIndividual) {
    return { comboAndIndividual: true };
  }

  if (!hasCombo && !hasIndividual) {
    return { requireVaccine: true };
  }

  return null;
}

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
    MatError,
    MatProgressSpinnerModule,
    KitTestFormComponent
  ],
  providers: [DatePipe]
})
export class RegisterForVaccinationComponent implements OnInit, OnDestroy {

  total = 0;
  finalRegistrationCode: string | null = null;
  finalAppointmentDetails: string | null = null;
  loading = false;

  customerInfoForm = this.fb.group({
    fullName: ['', Validators.required],
    furigana: ['', [Validators.required, Validators.pattern(/^[ァ-ンヴー]+$/)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{3}-?\d{4}$/)]],
    prefecture: ['', Validators.required],
    municipality: ['', Validators.required],
    address: ['', Validators.required],
    building: [''],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    verificationMethod: ['', Validators.required],
    verificationCode: [''],
    token: ['', Validators.required],
    appointment: this.fb.group({
      prefectureId: [null, Validators.required],
      locationId: [null, Validators.required],
      timeSlotId: [null, Validators.required],
    }),
  });

  comboProducts: DisplayProductDto[] = [];
  singleProducts: DisplayProductDto[] = [];
  kitTestProducts: DisplayProductDto[] = [];
  singleProductPrice: { [key: number]: number } = {}; // Use productId as key

  petInfoForms: FormGroup;

  private rabiesShotProductId: number | null = null;
  private mixedProductId: number | null = null;
  private setDComboProducts: DisplayProductDto[] = [];
  private productCodeToProductMap: Map<string, VaccineProductDto> = new Map();
  private ngUnsubscribe = new Subject<void>();
  private declinedRecommendationIndices = new Set<number>();
  private isDialogOpened = false;


  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private registerService: RegisterService,
    private datePipe: DatePipe,
    private dialog: MatDialog
  ) {
    this.petInfoForms = this.fb.group({
      pets: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.pets.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.recalculateTotal();
      this.checkVaccineRecommendation();
    });

    this.productService.getAllProduct().subscribe((products: VaccineProductDto[]) => {
      const comboProducts: VaccineProductDto[] = [];
      const singleProducts: VaccineProductDto[] = [];
      const kitTestProducts: VaccineProductDto[] = [];

      products.forEach(product => {
        this.productCodeToProductMap.set(product.productCode, product);

        product.displayNameEn = this.formatDescription(product.displayNameEn);
        product.displayNameJp = this.formatDescription(product.displayNameJp);
        product.descriptionEn = this.formatDescription(product.descriptionEn);
        product.descriptionJp = this.formatDescription(product.descriptionJp);
        if (product.isKitTest) {
          kitTestProducts.push(product);
        } else {
          if (product.isCombo) {
            comboProducts.push(product);
          } else {
            singleProducts.push(product);
          }
        }
      });

      this.comboProducts = this.populateRowspan(comboProducts, 'productCode');
      this.singleProducts = this.populateRowspan(singleProducts, 'productCode');
      this.kitTestProducts = this.populateRowspan(kitTestProducts, 'productCode');
      this.singleProducts.forEach(product => this.singleProductPrice[product.productId] = product.price);

      // Identify specific products for recommendation logic
      this.rabiesShotProductId = this.productCodeToProductMap.get('RABIES_SHOT')?.productId || null;
      this.mixedProductId = this.productCodeToProductMap.get('MIXED')?.productId || null;
      this.setDComboProducts = this.comboProducts.filter(p => p.productCode === 'SET_D');

      this.addPet();
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  formatDescription(description: string = ''): string {
    return description.replace(/\\n/g, '\n');
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
      this.singleProducts.map(p => [p.productId, [{ value: 0, disabled: true }, [Validators.min(p.validations.minAmount), Validators.max(p.validations.maxAmount)]]])
    );

    return this.fb.group({
      petType: ['DOG', Validators.required],
      petName: ['', Validators.required],
      petBreed: ['', Validators.required],
      birthDate: [moment().toDate(), Validators.required],
      gender: ['male', Validators.required],
      furColor: ['', Validators.required],
      weight: ['', [Validators.required, Validators.min(1)]],
      size: ['SMALL', Validators.required],
      healthStatus: this.fb.group({
        healthy: [false],
        eatingWell: [false],
        digestionGood: [false],
      }),
      healthCommitment: [false, Validators.requiredTrue],
      comboVaccine: [null], // This will hold the product object
      kitTestSelection: [null], // This will hold the product object
      individualVaccineSelection: this.fb.group(selectVaccineControls),
      individualVaccineAmount: this.fb.group(amountVaccineControls),
    }, { validators: requireVaccineSelection });
  }

  addPet(): void {
    const newPetGroup = this.createPetGroup();
    this.pets.push(newPetGroup);

    // Subscribe to comboVaccine changes for this new pet group
    newPetGroup.get('comboVaccine')?.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(selectedCombo => {
        this.handleComboChange(newPetGroup, selectedCombo);
      });
  }

  removePet(index: number): void {
    if (this.pets.length > 1) {
      this.pets.removeAt(index);
      // Also remove from declined set if it exists, though indices shift so this is tricky.
      // For simplicity, we can clear the set or try to adjust.
      // Clearing is safer to avoid wrong suppression.
      this.declinedRecommendationIndices.clear();
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
    this.loading = true;
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
        birthDate: this.datePipe.transform(pet.birthDate, 'yyyy-MM-dd'), // Format birthDate here
        comboVaccine: pet.comboVaccine ? pet.comboVaccine.productId : null,
        kitTest: pet.kitTestSelection ? pet.kitTestSelection.productId : null,
        individualVaccineAmount: individualVaccineAmount,
        individualVaccineSelection: undefined, // Remove from final payload
      };
    });

    const customerInfo = this.customerInfoForm.getRawValue();
    if (customerInfo.verificationMethod === 'sms') {
      customerInfo.phone = this.formatPhoneNumber(customerInfo.phone);
    }

    const request = {
      customerInfo: customerInfo,
      petInfos: petInfos,
      token: this.customerInfoForm.get('token')?.value,
      verificationMethod: customerInfo.verificationMethod
    };

    this.registerService.register(request).subscribe({
      next: (response) => {
        this.loading = false;
        this.finalRegistrationCode = response.registrationCode;
        const formattedDate = this.datePipe.transform(response.appointmentDate, 'yyyy年M月d日');
        this.finalAppointmentDetails = `日付：${formattedDate}\n時間: ${response.timeSlotLabel}\n会場（店舗名): ${response.locationName}`;

        stepper.next(); // Move to the success step
      },
      error: () => {
        this.loading = false;
        // Handle error (e.g., show a snackbar)
      }
    });
  }

  private formatPhoneNumber(phone: string | null): string {
    if (!phone) return '';
    // Remove leading zero if present
    const cleanPhone = phone.replace(/^0+/, '');
    return `${cleanPhone}`;
  }

  recalculateTotal(): void {
    let total = 0;
    const pets = this.petInfoForms.getRawValue().pets;
    for (const pet of pets) {
      total += (pet.comboVaccine?.price || 0);
      total += (pet.kitTestSelection?.price || 0);
      total += this.getIndividualVaccinesPrice(pet.individualVaccineSelection, pet.individualVaccineAmount);
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

  private checkVaccineRecommendation(): void {
    if (!this.rabiesShotProductId || !this.mixedProductId || this.setDComboProducts.length === 0 || this.isDialogOpened) {
      return; // Products not yet loaded or identified or dialog open
    }

    let targetPetIndex = -1;
    let targetPetGroup: FormGroup | null = null;
    let targetIndividualSelection: FormGroup | null = null;

    for (let i = 0; i < this.pets.controls.length; i++) {
      const petFormGroup = this.pets.controls[i] as FormGroup;
      const individualSelection = petFormGroup.get('individualVaccineSelection') as FormGroup;
      const comboVaccineControl = petFormGroup.get('comboVaccine');

      const isRabiesSelected = individualSelection.get(this.rabiesShotProductId!.toString())?.value;
      const isMixedSelected = individualSelection.get(this.mixedProductId!.toString())?.value;
      const isSetDSelected = this.setDComboProducts.some(p => p.productId === comboVaccineControl?.value?.productId);

      if (isRabiesSelected && isMixedSelected && !isSetDSelected) {
        if (!this.declinedRecommendationIndices.has(i)) {
          targetPetIndex = i;
          targetPetGroup = petFormGroup;
          targetIndividualSelection = individualSelection;
          break; // Found a candidate, stop searching
        }
      } else {
        // If condition is no longer met (e.g. user deselected one), reset the declined state
        // so they can be prompted again if they re-select.
        this.declinedRecommendationIndices.delete(i);
      }
    }

    if (targetPetIndex !== -1 && targetPetGroup && targetIndividualSelection) {
      this.isDialogOpened = true;
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: 'Recommendation',
          message: 'You have selected both Rabies Shot and Mixed vaccines individually. Would you like to switch to Dセット combo for potential cost savings?',
          confirmText: 'Switch to Dセット',
          cancelText: 'Keep Selection'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        this.isDialogOpened = false;
        if (result) {
          this.applySetDRecommendation(targetPetGroup!, targetIndividualSelection!);
        } else {
          this.declinedRecommendationIndices.add(targetPetIndex);
        }
      });
    }
  }

  private applySetDRecommendation(petFormGroup: FormGroup, individualSelection: FormGroup): void {
    const petSize = petFormGroup.get('size')?.value;
    const setDForPet = this.setDComboProducts.find(p => p.petSize === petSize);

    if (setDForPet) {
      // Set SET_D combo
      petFormGroup.get('comboVaccine')?.setValue(setDForPet);

      // Deselect individual RABIES_SHOT and MIXED
      individualSelection.get(this.rabiesShotProductId!.toString())?.setValue(false);
      individualSelection.get(this.mixedProductId!.toString())?.setValue(false);

      // Set amounts to 0 for deselected individual vaccines
      const individualAmount = petFormGroup.get('individualVaccineAmount') as FormGroup;
      individualAmount.get(this.rabiesShotProductId!.toString())?.setValue(0);
      individualAmount.get(this.mixedProductId!.toString())?.setValue(0);

      // Trigger recalculation and form updates
      petFormGroup.updateValueAndValidity();
      this.recalculateTotal();
    }
  }

  private handleComboChange(petFormGroup: FormGroup, selectedCombo: DisplayProductDto | null): void {
    if (!this.rabiesShotProductId || !this.mixedProductId) return;

    const individualSelection = petFormGroup.get('individualVaccineSelection') as FormGroup;
    const individualAmount = petFormGroup.get('individualVaccineAmount') as FormGroup;

    const rabiesControl = individualSelection.get(this.rabiesShotProductId.toString());
    const mixedControl = individualSelection.get(this.mixedProductId.toString());
    const rabiesAmountControl = individualAmount.get(this.rabiesShotProductId.toString());
    const mixedAmountControl = individualAmount.get(this.mixedProductId.toString());

    if (selectedCombo && this.setDComboProducts.some(p => p.productId === selectedCombo.productId)) {
      // User selected SET_D, so clear and disable individual selections
      rabiesControl?.setValue(false);
      rabiesControl?.disable();
      mixedControl?.setValue(false);
      mixedControl?.disable();

      rabiesAmountControl?.setValue(0);
      mixedAmountControl?.setValue(0);
    } else {
      // User deselected SET_D or chose another combo, so re-enable the controls
      rabiesControl?.enable();
      mixedControl?.enable();
    }
  }
}
