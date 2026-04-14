import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
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
    phone: ['', [Validators.required, Validators.pattern(/^0\d{9,10}$/)]],
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


  private productCodeToProductMap: Map<string, VaccineProductDto> = new Map();
  private productIdToProductCodeMap: Map<number, string> = new Map();
  private ngUnsubscribe = new Subject<void>();
  private declinedRecommendationIndices = new Set<number>();
  private isRecommendationDialogOpened = false; // Renamed from isDialogOpened
  private declinedSpecificRecommendationIndices = new Set<number>(); // New


  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private registerService: RegisterService,
    private datePipe: DatePipe,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.petInfoForms = this.fb.group({
      pets: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.pets.valueChanges.pipe(takeUntil(this.ngUnsubscribe)).subscribe(() => {
      this.recalculateTotal();
    });

    this.productService.getAllProduct().subscribe((products: VaccineProductDto[]) => {
      const comboProducts: VaccineProductDto[] = [];
      const singleProducts: VaccineProductDto[] = [];
      const kitTestProducts: VaccineProductDto[] = [];

      products.forEach(product => {
        this.productIdToProductCodeMap.set(product.productId, product.productCode);
        if (product.isKitTest) {
          this.productCodeToProductMap.set(product.productCode + ':' + product.petSize, product);
          kitTestProducts.push(product);
        } else {
          if (product.isCombo) {
            comboProducts.push(product);
          } else {
            this.productCodeToProductMap.set(product.productCode + ':' + product.petSize, product);
            singleProducts.push(product);
          }
        }
      });

      this.comboProducts = this.populateRowspan(comboProducts, 'productCode');
      this.singleProducts = this.populateRowspan(singleProducts, 'productCode');
      this.kitTestProducts = this.populateRowspan(kitTestProducts, 'productCode');
      this.singleProducts.forEach(product => this.singleProductPrice[product.productId] = product.price);

      this.comboProducts.forEach(product => {
        this.productCodeToProductMap.set(product.productCode + ':' + product.petSize, product);
      });

      this.addPet();
    });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
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
      birthDate: [null, Validators.required],
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
    }, { validators: this.requireVaccineSelection() });
  }

  addPet(): void {
    const newPetGroup = this.createPetGroup();
    this.pets.push(newPetGroup);

    // Subscribe to comboVaccine changes for this new pet group
    newPetGroup.get('comboVaccine')?.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(selectedCombo => {
        // enable / disable individual base on selected combo
        this.handleComboChange(newPetGroup, selectedCombo);
      });

    //
    newPetGroup.get('individualVaccineSelection')?.valueChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(_ => {
        // show recommendation
        this.checkVaccineSetDRecommendation(newPetGroup);
        this.checkVaccineSetARecommendation(newPetGroup);
      });
  }

  removePet(index: number): void {
    if (this.pets.length > 1) {
      this.pets.removeAt(index);
      // Also remove from declined set if it exists, though indices shift so this is tricky.
      // For simplicity, we can clear the set or try to adjust.
      // Clearing is safer to avoid wrong suppression.
      this.declinedRecommendationIndices.clear();
      this.declinedSpecificRecommendationIndices.clear(); // New
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
    customerInfo.phone = this.formatPhoneNumber(customerInfo.phone);

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

  private checkVaccineSetDRecommendation(petFormGroup: FormGroup): void {
    const petSize = petFormGroup.get('size')?.value;

    const rabiesShotProductId = this.productCodeToProductMap.get(`RABIES_SHOT:${petSize}`)?.productId
      || this.productCodeToProductMap.get('RABIES_SHOT:ALL')?.productId;
    const mixedProductId = this.productCodeToProductMap.get(`MIXED:${petSize}`)?.productId
      || this.productCodeToProductMap.get('MIXED:ALL')?.productId;
    const setDProduct = this.productCodeToProductMap.get(`SET_D:${petSize}`)
      || this.productCodeToProductMap.get('SET_D:ALL');

    const individualSelection = petFormGroup.get('individualVaccineSelection') as FormGroup;
    const individualAmount = petFormGroup.get('individualVaccineAmount') as FormGroup;
    const comboVaccineControl = petFormGroup.get('comboVaccine');

    const rabiesControl = individualSelection.get(`${rabiesShotProductId}`);
    const mixedControl = individualSelection.get(`${mixedProductId}`);
    //
    const rabiesAmountControl = individualAmount.get(`${rabiesShotProductId}`);
    const mixedAmountControl = individualAmount.get(`${mixedProductId}`);

    const isRabiesSelected = individualSelection.get(rabiesShotProductId!.toString())?.value;
    const isMixedSelected = individualSelection.get(mixedProductId!.toString())?.value;
    const isSetDSelected = setDProduct?.productId === comboVaccineControl?.value?.productId;

    if (isRabiesSelected && isMixedSelected && !isSetDSelected) {
      this.isRecommendationDialogOpened = true;
      const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
        width: '400px',
        data: {
          title: this.translate.instant('dialog.recommendation.title'),
          message: this.translate.instant('dialog.recommendation.message'),
          confirmText: this.translate.instant('dialog.recommendation.confirmText'),
          cancelText: this.translate.instant('dialog.recommendation.cancelText')
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        this.isRecommendationDialogOpened = false;
        if (result) {
          console.log(setDProduct)
          this.applySetDRecommendation(petFormGroup, setDProduct, rabiesControl, rabiesAmountControl, mixedControl, mixedAmountControl);
        }
      });
    }
  }

  private checkVaccineSetARecommendation(petFormGroup: FormGroup): void {
    const petSize = petFormGroup.get('size')?.value;

    const rabiesShotProductId = this.productCodeToProductMap.get(`RABIES_SHOT:${petSize}`)?.productId
      || this.productCodeToProductMap.get('RABIES_SHOT:ALL')?.productId;
    const mixedProductId = this.productCodeToProductMap.get(`MIXED:${petSize}`)?.productId
      || this.productCodeToProductMap.get('MIXED:ALL')?.productId;
    const setAProduct = this.productCodeToProductMap.get(`SET_A:${petSize}`)
      || this.productCodeToProductMap.get('SET_A:ALL');

    const individualSelection = petFormGroup.get('individualVaccineSelection') as FormGroup;
    const individualAmount = petFormGroup.get('individualVaccineAmount') as FormGroup;
    const comboVaccineControl = petFormGroup.get('comboVaccine');

    const rabiesControl = individualSelection.get(`${rabiesShotProductId}`);
    const mixedControl = individualSelection.get(`${mixedProductId}`);
    //
    const rabiesAmountControl = individualAmount.get(`${rabiesShotProductId}`);
    const mixedAmountControl = individualAmount.get(`${mixedProductId}`);

    const isRabiesSelected = individualSelection.get(rabiesShotProductId!.toString())?.value;
    const isMixedSelected = individualSelection.get(mixedProductId!.toString())?.value;

    let shouldRecommendSetA = false;
    let conflictingIndividualControl: AbstractControl | null;
    let conflictingIndividualAmountControl: AbstractControl | null;
    let messageKey: string = '';

    if (comboVaccineControl?.value?.productCode === 'SET_B' && isRabiesSelected) {
      shouldRecommendSetA = true;
      conflictingIndividualControl = rabiesControl;
      conflictingIndividualAmountControl = rabiesAmountControl;
      messageKey = 'dialog.recommendation.setBWithRabies'; // New translation key
    } else if (comboVaccineControl?.value?.productCode === 'SET_C' && isMixedSelected) {
      shouldRecommendSetA = true;
      conflictingIndividualControl = mixedControl;
      conflictingIndividualAmountControl = mixedAmountControl;
      messageKey = 'dialog.recommendation.setCWithMixed'; // New translation key
    }

    if (!shouldRecommendSetA) {
      return;
    }

    this.isRecommendationDialogOpened = true;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: this.translate.instant('dialog.recommendation.title'),
        message: this.translate.instant(messageKey),
        confirmText: this.translate.instant('dialog.recommendation.switchToSetA'), // New translation key
        cancelText: this.translate.instant('dialog.recommendation.keepSelection') // New translation key
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isRecommendationDialogOpened = false;
      if (result) {
        this.applySetARecommendation(petFormGroup, setAProduct, conflictingIndividualControl, conflictingIndividualAmountControl);
      }
    });

  }

  private applySetARecommendation(petFormGroup: FormGroup, setAProduct: VaccineProductDto | undefined,
                                  control: AbstractControl | null, amountControl: AbstractControl | null): void {
    if (!setAProduct) {
      return;
    }
    // Set SET_A combo
    petFormGroup.get('comboVaccine')?.setValue(setAProduct);

    // Deselect the conflicting individual vaccine
    this.disableIndividualVaccine(control, amountControl);

    // Trigger recalculation and form updates
    petFormGroup.updateValueAndValidity();
    this.recalculateTotal();

  }

  private applySetDRecommendation(petFormGroup: FormGroup, setDProduct: VaccineProductDto | undefined,
                                  rabiesControl: AbstractControl | null, rabiesAmountControl: AbstractControl | null,
                                  mixedControl: AbstractControl | null, mixedAmountControl: AbstractControl | null): void {
    if (!setDProduct) {
      return
    }

    // Set SET_D combo
    petFormGroup.get('comboVaccine')?.setValue(setDProduct);
    console.log(setDProduct)

    // Deselect individual RABIES_SHOT and MIXED
    this.disableIndividualVaccine(rabiesControl, rabiesAmountControl);
    this.disableIndividualVaccine(mixedControl, mixedAmountControl);

    // Trigger recalculation and form updates
    petFormGroup.updateValueAndValidity();
    this.recalculateTotal();
  }

  private handleComboChange(petFormGroup: FormGroup, selectedCombo: DisplayProductDto | null): void {
    // if (!this.rabiesShotProductId || !this.mixedProductId || !this.heartwormMedProductId) return;
    const petSize = petFormGroup.get('size')?.value;

    let parasitePrevProduct = this.productCodeToProductMap.get(`PARASITE_PREV:${petSize}`)
      || this.productCodeToProductMap.get('PARASITE_PREV:ALL');

    const rabiesShotProductId = this.productCodeToProductMap.get(`RABIES_SHOT:${petSize}`)?.productId
      || this.productCodeToProductMap.get('RABIES_SHOT:ALL')?.productId;
    const mixedProductId = this.productCodeToProductMap.get(`MIXED:${petSize}`)?.productId
      || this.productCodeToProductMap.get('MIXED:ALL')?.productId;
    const heartwormMedProductId = this.productCodeToProductMap.get(`HEARTWORM_MED:${petSize}`)?.productId
      || this.productCodeToProductMap.get('HEARTWORM_MED:ALL')?.productId;
    const parasitePrevProductId = parasitePrevProduct?.productId;

    const individualSelection = petFormGroup.get('individualVaccineSelection') as FormGroup;
    const individualAmount = petFormGroup.get('individualVaccineAmount') as FormGroup;

    const rabiesControl = individualSelection.get(`${rabiesShotProductId}`);
    const mixedControl = individualSelection.get(`${mixedProductId}`);
    const heartwormControl = individualSelection.get(`${heartwormMedProductId}`);
    const parasitePrevControl = individualSelection.get(`${parasitePrevProductId}`);
    //
    const rabiesAmountControl = individualAmount.get(`${rabiesShotProductId}`);
    const mixedAmountControl = individualAmount.get(`${mixedProductId}`);
    const heartwormAmountControl = individualAmount.get(`${heartwormMedProductId}`);
    const parasitePrevAmountControl = individualAmount.get(`${parasitePrevProductId}`);

    // Reset all individual controls to enabled state first (unless petSize specific)
    rabiesControl?.enable();
    mixedControl?.enable();
    heartwormControl?.enable();
    parasitePrevControl?.enable();

    if (selectedCombo) {
      switch (selectedCombo.productCode) {
        case 'SET_A':
          this.changeMinMaxValidation(parasitePrevAmountControl, parasitePrevProduct, 1, 9);
          this.disableIndividualVaccine(mixedControl, mixedAmountControl);
          this.disableIndividualVaccine(heartwormControl, heartwormAmountControl);
          this.disableIndividualVaccine(rabiesControl, rabiesAmountControl);
          break;
        case 'SET_B':
          this.changeMinMaxValidation(parasitePrevAmountControl, parasitePrevProduct, 1, 9);
          this.disableIndividualVaccine(mixedControl, mixedAmountControl);
          this.disableIndividualVaccine(heartwormControl, heartwormAmountControl);
          break;
        case 'SET_C':
          this.changeMinMaxValidation(parasitePrevAmountControl, parasitePrevProduct, 1, 9);
          this.disableIndividualVaccine(rabiesControl, rabiesAmountControl);
          this.disableIndividualVaccine(heartwormControl, heartwormAmountControl);
          break;
        case 'SET_D':
          this.changeMinMaxValidation(parasitePrevAmountControl, parasitePrevProduct, 1, 12);
          this.disableIndividualVaccine(rabiesControl, rabiesAmountControl);
          this.disableIndividualVaccine(mixedControl, mixedAmountControl);
          break;
        default:
          // If another combo is selected or combo deselected, re-enable
          // (already handled by initial enable calls)
          break;
      }
    }
  }

  private changeMinMaxValidation(amountControl: AbstractControl | null, product: VaccineProductDto | null | undefined, min: number, max: number) {
    amountControl?.setValidators([Validators.min(min), Validators.max(max)]);

    if (!product || !product.validations) {
      return;
    }

    product.validations['minAmount'] = min;
    product.validations['maxAmount'] = max;
  }

  private disableIndividualVaccine(selectControl: AbstractControl | null, amountControl: AbstractControl | null) {
    selectControl?.setValue(false);
    selectControl?.disable();
    amountControl?.setValue(0);
    amountControl?.disable()
  }

  private requireVaccineSelection(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const comboVaccine = control.get('comboVaccine')?.value;
      const individualVaccineSelection = control.get('individualVaccineSelection')?.value;

      const hasCombo = !!comboVaccine;
      const hasIndividual = individualVaccineSelection && Object.values(individualVaccineSelection).some(v => v);

      // if (hasCombo && hasIndividual) {
      //   if (comboVaccine.productCode === 'SET_D') {
      //     const selectedIndividualProductIds = Object.keys(individualVaccineSelection)
      //       .filter(id => individualVaccineSelection[id]);
      //
      //     const allowedProductCodes = ['HEARTWORM_MED', 'PARASITE_PREV'];
      //     const allSelectedAreAllowed = selectedIndividualProductIds.every(id => {
      //       const productCode = this.productIdToProductCodeMap.get(Number(id));
      //       return productCode && allowedProductCodes.includes(productCode);
      //     });
      //
      //     if (allSelectedAreAllowed) {
      //       return null; // Allowed: SET_D and some allowed individual vaccines
      //     }
      //   }
      //   // If combo is not SET_D and has individual, or if it is SET_D with non-allowed individual.
      //   return { comboAndIndividual: true };
      // }

      if (!hasCombo && !hasIndividual) {
        return { requireVaccine: true };
      }

      return null;
    };
  }
}
