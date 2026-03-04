import {Component, Input} from '@angular/core';
import {AbstractControl, FormControl, ReactiveFormsModule} from '@angular/forms';
import {DisplayProductDto} from '../../../models/product/product.dto';
import {MatTableModule} from '@angular/material/table';
import {MatRadioModule} from '@angular/material/radio';
import {CommonModule, DecimalPipe} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatCheckbox} from "@angular/material/checkbox";
import {LineBreakPipe} from "../../../pipe/line-break.pipe";

@Component({
  selector: 'app-kit-test-form',
  templateUrl: './kit-test-form.component.html',
  styleUrls: ['./kit-test-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatRadioModule,
    DecimalPipe,
    TranslateModule,
    MatCardModule,
    MatDividerModule,
    MatCheckbox,
    LineBreakPipe
  ]
})
export class KitTestFormComponent {
  @Input() products: DisplayProductDto[] = [];
  @Input() petSize: AbstractControl | null = null;
  @Input() selectedVaccine!: AbstractControl | null;

  displayedColumns: string[] = ['name', 'content', 'size', 'price', 'select'];

  // Getter to safely cast for the template
  get selectedVaccineControl(): FormControl {
    return this.selectedVaccine as FormControl;
  }
}
