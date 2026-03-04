import {Component, Input, OnInit} from '@angular/core';
import {AbstractControl, FormControl, ReactiveFormsModule} from '@angular/forms';
import {DisplayProductDto} from '../../../models/product/product.dto';
import {MatTableModule} from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MatCardModule} from "@angular/material/card";
import {MatDivider} from "@angular/material/list";
import {LineBreakPipe} from "../../../pipe/line-break.pipe";

@Component({
  selector: 'app-vaccine-individual-form',
  templateUrl: './vaccine-individual-form.component.html',
  styleUrls: ['./vaccine-individual-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    MatCardModule,
    MatDivider,
    LineBreakPipe,
  ]
})
export class VaccineIndividualFormComponent implements OnInit {

  @Input() products!: DisplayProductDto[];
  @Input() selectedVaccine!: AbstractControl | null;
  @Input() amountVaccine!: AbstractControl | null;
  @Input() petSize!: AbstractControl | null;

  displayedColumns = ['name', 'content', 'size', 'price', 'select', 'amount'];

  ngOnInit(): void {
    if (this.petSize) {
      this.petSize.valueChanges.subscribe((size: string) => {
        this.amountVaccine?.reset({}, { emitEvent: false });
        this.selectedVaccine?.reset({}, { emitEvent: false });

        this.products?.forEach(product => {
          const selectionControl = this.getSelectionControl(product.productId);
          const amountControl = this.getAmountControl(product.productId);

          if (selectionControl && amountControl) {
            amountControl.disable();
            selectionControl.disable();
            if (product.petSize === 'ALL' || product.petSize === size) {
              selectionControl.enable();
            }
          }
        });
      });

      this.petSize.setValue('SMALL');
    }
  }

  onSelectVaccine(productId: number): void {
    const amountControl = this.getAmountControl(productId);
    const selectionControl = this.getSelectionControl(productId);
    const product = this.getProductById(productId);

    if (selectionControl?.value) {
      amountControl?.enable();
      if (product && product.validations && product.validations.minAmount === product.validations.maxAmount) {
        amountControl?.setValue(product.validations.minAmount);
        amountControl?.disable();
      } else if (amountControl?.value < 1) {
        amountControl?.setValue(1);
      }
    } else {
      amountControl?.setValue(0);
      amountControl?.disable();
    }
  }

  getProductById(productId: number): DisplayProductDto | undefined {
    return this.products.find(p => p.productId === productId);
  }

  getSelectionControl(productId: number): FormControl | null {
    return this.selectedVaccine?.get(String(productId)) as FormControl | null;
  }

  getAmountControl(productId: number): FormControl | null {
    return this.amountVaccine?.get(String(productId)) as FormControl | null;
  }
}
