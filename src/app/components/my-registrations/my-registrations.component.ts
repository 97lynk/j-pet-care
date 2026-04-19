import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { RegisterService, RegistrationDetailsResponse } from '../../services/register.service';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../register-for-vaccination/confirmation-dialog/confirmation-dialog.component';
import { MatDivider } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LineBreakPipe } from '../../pipe/line-break.pipe';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-my-registrations',
  templateUrl: './my-registrations.component.html',
  styleUrls: ['./my-registrations.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    MatDivider,
    CurrencyPipe,
    DatePipe,
    MatButton,
    MatIcon,
    MatProgressBarModule,
    MatTooltipModule,
    LineBreakPipe,
    QRCodeComponent,
    MatDialogModule,
  ],
})
export class MyRegistrationsComponent implements OnInit {
  viewForm = this.fb.group({
    registrationCode: ['', [Validators.required, Validators.minLength(10)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+-\s]{10,}$/)]],
    otp: [''],
  });

  message: string | null = null;
  isError = false;
  otpSent = false;
  submitting = false;
  registrationDetails: RegistrationDetailsResponse | null = null;

  // edit session state (FE-1)
  editJwt: string | null = null;
  editLocked = false;
  editLockedReason: string | null = null;
  sessionExpired = false;
  registrationCancelled = false;

  // customer edit (FE-4)
  customerEditMode = false;
  customerEditForm!: FormGroup;
  customerSaving = false;

  // pet edit keyed by orderId (FE-5)
  petEditMode: Record<number, boolean> = {};
  petEditForms: Record<number, FormGroup> = {};
  petSaving: Record<number, boolean> = {};

  // order delete keyed by orderId (FE-6)
  orderDeleting: Record<number, boolean> = {};

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const reason = params.get('reason');
      this.sessionExpired = reason === 'session_expired';
      this.registrationCancelled = reason === 'registration_cancelled';
    });
  }

  calculateOrderTotal(order: any): number {
    return order.vaccinationOrderItems.reduce((acc: number, item: any) => acc + (item.total || 0), 0);
  }

  getGrandTotal(): number {
    if (!this.registrationDetails?.vaccinationOrders) return 0;
    return this.registrationDetails.vaccinationOrders.reduce(
      (acc, order) => acc + this.calculateOrderTotal(order), 0
    );
  }

  deriveSizeKey(weight: number): string {
    if (!weight || weight < 10) return 'SMALL';
    if (weight < 25) return 'MEDIUM';
    return 'LARGE';
  }

  onSearch(): void {
    if (this.viewForm.get('registrationCode')?.valid && this.viewForm.get('phoneNumber')?.valid && !this.submitting) {
      this.submitting = true;
      this.message = null;
      this.isError = false;
      const code = this.viewForm.value.registrationCode!;
      const phone = this.formatPhoneNumber(this.viewForm.value.phoneNumber!);

      this.registerService.sendViewRegistrationOtp(code, phone).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: () => {
          this.otpSent = true;
          this.message = 'myRegistrations.otpSent';
          this.viewForm.get('otp')?.setValidators([Validators.required, Validators.minLength(6)]);
          this.viewForm.get('otp')?.updateValueAndValidity();
        },
        error: (err) => {
          console.error(err);
          this.message = 'myRegistrations.error';
          this.isError = true;
        },
      });
    }
  }

  onConfirm(): void {
    if (this.viewForm.valid && !this.submitting) {
      this.submitting = true;
      this.message = null;
      this.isError = false;
      const code = this.viewForm.value.registrationCode!;
      const phone = this.formatPhoneNumber(this.viewForm.value.phoneNumber!);
      const otp = this.viewForm.value.otp!;

      this.registerService.getRegistrationDetails(code, phone, otp).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: (data) => {
          this.registrationDetails = data;
          if (data.editJwt) {
            localStorage.setItem(`edit_jwt_${data.registrationCode}`, data.editJwt);
            this.editJwt = data.editJwt;
          } else {
            // Server returned no JWT (appointment within 24h) — clear any stale stored token
            localStorage.removeItem(`edit_jwt_${data.registrationCode}`);
            this.editJwt = null;
          }
          this.editLocked = data.editLocked ?? false;
          this.editLockedReason = data.editLockedReason ?? null;
          this.initEditForms(data);
          this.isError = false;
        },
        error: (err) => {
          console.error(err);
          this.message = 'myRegistrations.otpError';
          this.isError = true;
        },
      });
    }
  }

  // ── customer edit (FE-4) ───────────────────────────────────────────────────

  startEditCustomer(): void {
    if (this.customerEditMode) return;
    const ci = this.registrationDetails!.customerInfo;
    this.customerEditForm.patchValue({
      fullName: ci.fullName,
      furigana: ci.furigana,
      email: ci.email,
      postalCode: ci.postalCode,
      prefecture: ci.prefecture,
      municipality: ci.municipality,
      address: ci.address,
      building: ci.building ?? '',
    });
    this.customerEditMode = true;
  }

  cancelEditCustomer(): void {
    this.customerEditMode = false;
  }

  saveCustomer(): void {
    if (!this.customerEditForm.valid || !this.editJwt || this.customerSaving) return;
    this.customerSaving = true;
    const code = this.registrationDetails!.registrationCode;
    this.registerService.updateCustomer(code, this.customerEditForm.value, this.editJwt).pipe(
      finalize(() => this.customerSaving = false)
    ).subscribe({
      next: () => {
        Object.assign(this.registrationDetails!.customerInfo, this.customerEditForm.value);
        this.customerEditMode = false;
      },
      error: (err) => this.handleMutationError(err),
    });
  }

  // ── pet edit (FE-5) ───────────────────────────────────────────────────────

  startEditPet(orderId: number): void {
    if (this.petEditMode[orderId]) return;
    const order = this.registrationDetails!.vaccinationOrders.find(o => o.id === orderId);
    if (!order) return;
    this.petEditForms[orderId].patchValue({
      petName: order.petInfo.petName,
      breed: order.petInfo.breed,
      furColor: order.petInfo.furColor ?? '',
    });
    this.petEditMode[orderId] = true;
  }

  cancelEditPet(orderId: number): void {
    this.petEditMode[orderId] = false;
  }

  savePet(orderId: number): void {
    const form = this.petEditForms[orderId];
    if (!form.valid || !this.editJwt || this.petSaving[orderId]) return;
    this.petSaving[orderId] = true;
    const code = this.registrationDetails!.registrationCode;
    this.registerService.updatePet(code, orderId, form.value, this.editJwt).pipe(
      finalize(() => this.petSaving[orderId] = false)
    ).subscribe({
      next: () => {
        const order = this.registrationDetails!.vaccinationOrders.find(o => o.id === orderId);
        if (order) Object.assign(order.petInfo, form.value);
        this.petEditMode[orderId] = false;
      },
      error: (err) => this.handleMutationError(err),
    });
  }

  // ── order delete (FE-6 / FE-7) ────────────────────────────────────────────

  deleteOrder(orderId: number): void {
    if (!this.editJwt || this.orderDeleting[orderId]) return;

    const isLastOrder = this.registrationDetails!.vaccinationOrders.length === 1;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '420px',
      data: {
        title: this.translate.instant(
          isLastOrder ? 'myRegistrations.edit.deleteLastOrderTitle' : 'myRegistrations.edit.deleteOrderTitle'
        ),
        message: this.translate.instant(
          isLastOrder ? 'myRegistrations.edit.deleteLastOrderMessage' : 'myRegistrations.edit.deleteOrderMessage'
        ),
        confirmText: this.translate.instant('myRegistrations.edit.deleteConfirm'),
        cancelText: this.translate.instant('myRegistrations.edit.deleteCancel'),
      } as ConfirmationDialogData,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.orderDeleting[orderId] = true;
      const code = this.registrationDetails!.registrationCode;
      this.registerService.deleteOrder(code, orderId, this.editJwt!).pipe(
        finalize(() => { this.orderDeleting[orderId] = false; })
      ).subscribe({
        next: () => {
          if (isLastOrder) {
            // Registration is now cancelled — clear state and show banner
            localStorage.removeItem(`edit_jwt_${code}`);
            this.registrationDetails = null;
            this.editJwt = null;
            this.otpSent = false;
            this.router.navigate(['/my-registrations'], { queryParams: { reason: 'registration_cancelled' } });
          } else {
            this.registrationDetails!.vaccinationOrders =
              this.registrationDetails!.vaccinationOrders.filter(o => o.id !== orderId);
            delete this.petEditForms[orderId];
            delete this.petEditMode[orderId];
            delete this.petSaving[orderId];
            delete this.orderDeleting[orderId];
          }
        },
        error: (err) => this.handleMutationError(err),
      });
    });
  }

  // ── navigation ────────────────────────────────────────────────────────────

  protected backToPrevious(): void {
    if (this.registrationDetails) {
      localStorage.removeItem(`edit_jwt_${this.registrationDetails.registrationCode}`);
    }
    this.registrationDetails = null;
    this.otpSent = false;
    this.editJwt = null;
    this.editLocked = false;
    this.editLockedReason = null;
    this.customerEditMode = false;
    this.petEditMode = {};
    this.petEditForms = {};
    this.petSaving = {};
    this.orderDeleting = {};
  }

  // ── private helpers ───────────────────────────────────────────────────────

  private initEditForms(data: RegistrationDetailsResponse): void {
    const ci = data.customerInfo;
    this.customerEditForm = this.fb.group({
      fullName: [ci.fullName, Validators.required],
      furigana: [ci.furigana, Validators.required],
      email: [ci.email, [Validators.required, Validators.email]],
      postalCode: [ci.postalCode, Validators.required],
      prefecture: [ci.prefecture, Validators.required],
      municipality: [ci.municipality, Validators.required],
      address: [ci.address, Validators.required],
      building: [ci.building ?? ''],
    });

    this.petEditMode = {};
    this.petEditForms = {};
    this.petSaving = {};
    this.orderDeleting = {};

    for (const order of data.vaccinationOrders) {
      const pi = order.petInfo;
      this.petEditForms[order.id] = this.fb.group({
        petName: [pi.petName, Validators.required],
        breed: [pi.breed, Validators.required],
        furColor: [pi.furColor ?? ''],
      });
      this.petEditMode[order.id] = false;
      this.petSaving[order.id] = false;
      this.orderDeleting[order.id] = false;
    }
  }

  // FE-9: on 401 from any mutation, clear state and redirect
  private handleMutationError(err: any): void {
    console.error(err);
    if (err.status === 401) {
      if (this.registrationDetails) {
        localStorage.removeItem(`edit_jwt_${this.registrationDetails.registrationCode}`);
      }
      this.registrationDetails = null;
      this.editJwt = null;
      this.otpSent = false;
      this.router.navigate(['/my-registrations'], { queryParams: { reason: 'session_expired' } });
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    return phone.replace(/^0+/, '');
  }
}
