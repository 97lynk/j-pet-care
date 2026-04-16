import {Component} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {RegisterService} from '../../services/register.service';
import {CommonModule} from '@angular/common';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-cancel-registration',
  templateUrl: './cancel-registration.component.html',
  styleUrls: ['./cancel-registration.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
  ],
})
export class CancelRegistrationComponent {
  cancelForm = this.fb.group({
    registrationCode: ['', [Validators.required, Validators.minLength(10)]],
    otp: [''],
  });

  message: string | null = null;
  isError = false;
  otpSent = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService
  ) {}

  onSearch(): void {
    if (this.cancelForm.get('registrationCode')?.valid && !this.submitting) {
      this.submitting = true;
      this.message = null;
      this.isError = false;
      const code = this.cancelForm.value.registrationCode!;

      this.registerService.sendCancellationOtp(code).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: () => {
          this.otpSent = true;
          this.message = 'cancel.otpSent';
          this.cancelForm.get('otp')?.setValidators([Validators.required, Validators.minLength(6)]);
          this.cancelForm.get('otp')?.updateValueAndValidity();
        },
        error: (err) => {
          console.error(err);
          this.message = 'cancel.error';
          this.isError = true;
        },
      });
    }
  }

  onConfirm(): void {
    if (this.cancelForm.valid && !this.submitting) {
      this.submitting = true;
      this.message = null;
      this.isError = false;
      const code = this.cancelForm.value.registrationCode!;
      const otp = this.cancelForm.value.otp!;

      this.registerService.confirmCancellation(code, otp).pipe(
        finalize(() => this.submitting = false)
      ).subscribe({
        next: () => {
          this.message = 'cancel.success';
          this.isError = false;
          this.otpSent = false;
          this.cancelForm.reset();
        },
        error: (err) => {
          console.error(err);
          this.message = 'cancel.otpError';
          this.isError = true;
        },
      });
    }
  }
}
