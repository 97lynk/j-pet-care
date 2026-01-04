import {Component, Input} from '@angular/core';
import {MatCardModule} from '@angular/material/card';
import {TranslateModule} from '@ngx-translate/core';
import {QRCodeComponent} from 'angularx-qrcode';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {ClipboardModule} from '@angular/cdk/clipboard';

@Component({
  selector: 'app-register-success',
  templateUrl: './register-success.component.html',
  styleUrls: ['./register-success.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    TranslateModule,
    QRCodeComponent,
    MatIconModule,
    MatButtonModule,
    ClipboardModule
  ]
})
export class RegisterSuccessComponent {
  @Input() registrationCode: string | null = 'DEMO_CODE_123';
  @Input() appointmentDetails: string | null = 'Demo Location - Oct 31, 2024 - 10:00 AM';
}
