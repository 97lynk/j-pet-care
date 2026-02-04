import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RegisterService} from '../../../services/register.service';
import {MatRadioModule} from '@angular/material/radio';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';

export interface VerificationDialogData {
  phone: string;
  email: string;
}

@Component({
  selector: 'app-verification-dialog',
  templateUrl: './verification-dialog.component.html',
  styleUrls: ['./verification-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatRadioModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ]
})
export class VerificationDialogComponent {
  verificationForm: FormGroup;
  isVerificationSent = false;
  isVerified = false;

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    public dialogRef: MatDialogRef<VerificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VerificationDialogData
  ) {
    this.verificationForm = this.fb.group({
      method: ['sms', Validators.required],
      code: ['']
    });
  }

  onClose(): void {
    // Only for cancelling
    this.dialogRef.close();
  }

  onConfirmAndClose(): void {
    // Called only when isVerified is true
    const method = this.verificationForm.get('method')?.value;
    const code = this.verificationForm.get('code')?.value || 'VERIFIED';
    this.dialogRef.close({ verified: true, method: method, code: code });
  }

  sendCode(): void {
    const method = this.verificationForm.get('method')?.value;
    const target = method === 'sms' ? this.formatPhoneNumber(this.data.phone) : this.data.email;

    this.registerService.sendVerification(target, method).subscribe((response) => {
      if (response.status === 'VERIFIED') {
        this.isVerified = true;
        this.isVerificationSent = false; // Hide OTP input
      } else { // SENT_OTP
        this.isVerificationSent = true;
      }
    });
  }

  verifyCode(): void {
    const method = this.verificationForm.get('method')?.value;
    const target = method === 'sms' ? this.formatPhoneNumber(this.data.phone) : this.data.email;
    const code = this.verificationForm.get('code')?.value;

    if (!code) return;

    this.registerService.verify(target, code).subscribe((response) => {
      if (response.status === 'VERIFIED') {
        this.isVerified = true;
        this.isVerificationSent = false; // Hide OTP input
      } else {
        this.verificationForm.get('code')?.setErrors({ invalidCode: true });
      }
    });
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    const cleanPhone = phone.replace(/^0+/, '');
    return `${environment.phonePrefix}${cleanPhone}`;
  }
}
