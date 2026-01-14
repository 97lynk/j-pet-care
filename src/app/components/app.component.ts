import {Component} from '@angular/core';
import {TranslateModule, TranslateService} from '@ngx-translate/core';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [MatButtonToggleModule, TranslateModule, RouterOutlet],
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    translate.setDefaultLang('ja');
    translate.use('ja');
  }

  useLanguage(language: string): void {
    this.translate.use(language);
  }
}
