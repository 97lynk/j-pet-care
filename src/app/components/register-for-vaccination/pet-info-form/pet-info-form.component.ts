import {Component, EventEmitter, Input, OnInit, Output, ElementRef, ViewChild, AfterViewInit} from '@angular/core';
import {AbstractControl, FormGroup, ReactiveFormsModule, UntypedFormBuilder, Validators} from '@angular/forms';
import moment from 'moment/moment';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule} from '@angular/material/core';
import {MatRadioModule} from '@angular/material/radio';
import {MatSliderModule} from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatCardModule} from '@angular/material/card';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {DateAdapter} from "@angular/material/core";
import {LuxonDateAdapter} from "@angular/material-luxon-adapter";
import {JP_DATE_FORMATS} from "../../../date-format";

@Component({
  selector: 'app-pet-info-form',
  templateUrl: './pet-info-form.component.html',
  styleUrls: ['./pet-info-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSliderModule,
    MatCheckboxModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatCardModule,
    MatButtonToggleModule
  ],
  providers: [
    { provide: DateAdapter, useClass: LuxonDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: JP_DATE_FORMATS },
  ]
})
export class PetInfoFormComponent implements OnInit, AfterViewInit {
  @Input() form!: AbstractControl | null;
  @Input() index!: number;
  maxDate = moment().toDate();

  @Output() onRemove = new EventEmitter<number>();
  @ViewChild('petNameInput') petNameInput!: ElementRef;

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    if (!this.form) {
      // This block might not be necessary if the form is always passed from the parent
      this.form = this.fb.group({
        petName: ['', Validators.required],
        petBreed: ['', Validators.required],
        birthDate: [null, Validators.required],
        gender: ['', Validators.required],
        furColor: ['', Validators.required],
        weight: [1, Validators.required],
        size: ['SMALL', Validators.required],
        healthStatus: this.fb.group({
          healthy: [false],
          eatingWell: [false],
          digestionGood: [false]
        }),
        healthCommitment: [false, Validators.requiredTrue]
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.petNameInput) {
      this.petNameInput.nativeElement.focus();
      this.petNameInput.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Getter to safely cast for the template if needed, and for cleaner access
  get petForm(): FormGroup {
    return this.form as FormGroup;
  }

  onWeightChange(weight: number) {
    if (!this.form) return;

    let sizeValue = 'SMALL';
    if (weight >= 10 && weight < 20) {
      sizeValue = 'MEDIUM';
    } else if (weight >= 20) {
      sizeValue = 'LARGE';
    }
    this.form.patchValue({ size: sizeValue }, { emitEvent: true });
  }

  submit() {
    if (this.form?.valid) {
      // console.log(this.form.getRawValue());
    }
  }

  onPetSizeChange(size: any) {
    if (!this.form || !size) return;
  }

  onClickRemove() {
    this.onRemove.emit(this.index);
  }
}
