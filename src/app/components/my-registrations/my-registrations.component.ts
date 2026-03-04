import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatButton, MatButtonModule} from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { RegisterService, RegistrationResponse } from '../../services/register.service';
import {MatDivider} from "@angular/material/list";
import {MatIcon} from "@angular/material/icon";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatTooltipModule} from "@angular/material/tooltip";
import {LineBreakPipe} from "../../pipe/line-break.pipe";

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
    LineBreakPipe
  ]
})
export class MyRegistrationsComponent {
  viewForm = this.fb.group({
    registrationCode: ['', [Validators.required, Validators.minLength(10)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+-\s]{10,}$/)]],
    otp: [''],
  });

  message: string | null = null;
  isError = false;
  otpSent = false;
  submitting = false;
  registrationDetails: RegistrationResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService
  ) {}

  calculateOrderTotal(order: any): number {
    return order.vaccinationOrderItems.reduce((acc: number, item: any) => acc + (item.total || 0), 0);
  }

  getGrandTotal(): number {
    if (!this.registrationDetails || !this.registrationDetails.vaccinationOrders) {
      return 0;
    }
    return this.registrationDetails.vaccinationOrders.reduce((acc: number, order: any) => acc + this.calculateOrderTotal(order), 0);
  }

  onSearch(): void {
    if (this.viewForm.get('registrationCode')?.valid && this.viewForm.get('phoneNumber')?.valid && !this.submitting) {
      this.submitting = true;
      this.message = null;
      this.isError = false;
      const code = this.viewForm.value.registrationCode!;
      const phone = this.viewForm.value.phoneNumber!;

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
      const phone = this.viewForm.value.phoneNumber!;
      const otp = this.viewForm.value.otp!;

      this.registerService.getRegistrationDetails(code, phone, otp).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: (data) => {
          this.registrationDetails = data;
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

  protected backToPrevious() {
    this.registrationDetails = null;
    this.otpSent = false;
  }
}
