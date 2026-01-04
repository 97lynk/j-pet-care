import {Component, Input, OnInit} from '@angular/core';
import {DisplayProductDto} from '../../../models/product/product.dto';
import {AbstractControl, FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatRadioModule} from '@angular/material/radio';
import {MatTableModule} from '@angular/material/table';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MatCardModule} from "@angular/material/card";
import {MatDivider} from "@angular/material/list";

@Component({
  selector: 'app-vaccine-combo-form',
  templateUrl: './vaccine-combo-form.component.html',
  styleUrls: ['./vaccine-combo-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatRadioModule,
    MatTableModule,
    TranslateModule,
    MatCardModule,
    MatDivider,
  ]
})
export class VaccineComboFormComponent implements OnInit {

  @Input() products!: DisplayProductDto[];
  @Input() selectedVaccine!: AbstractControl | null;
  @Input() petSize!: AbstractControl | null;

  displayedColumns = ['name', 'content', 'size', 'price', 'select'];

  constructor() { }

  ngOnInit(): void {
    if (this.petSize) {
      this.petSize.valueChanges.subscribe(() => {
        this.selectedVaccine?.setValue(null);
      });
    }
  }

  // Getter to safely cast for the template
  get selectedVaccineControl(): FormControl {
    return this.selectedVaccine as FormControl;
  }

  onSelectVaccine(value: any): void {
    if (this.selectedVaccine) {
      if (value === this.selectedVaccine.value) {
        this.selectedVaccine.setValue(null);
      } else {
        this.selectedVaccine.setValue(value);
      }
    }
  }
}
