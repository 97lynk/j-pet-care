import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter, Routes} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideTranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import {environment} from '../environments/environment';
import {mockHttpInterceptor} from './services/mock-http-interceptor';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import {provideAnimations} from '@angular/platform-browser/animations';
import {MyRegistrationsComponent} from "./components/my-registrations/my-registrations.component";
import {CancelRegistrationComponent} from "./components/cancel-registration/cancel-registration.component";
import {
  RegisterForVaccinationComponent
} from "./components/register-for-vaccination/register-for-vaccination.component";
import {HomeComponent} from "./components/home/home.component";


export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
  },
  {
    path: 'register',
    component: RegisterForVaccinationComponent,
  },
  {
    path: 'cancel',
    component: CancelRegistrationComponent,
  },
  {
    path: 'my-registrations',
    component: MyRegistrationsComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors(environment.useMock ? [mockHttpInterceptor] : [])
    ),
    provideTranslateService({
      lang: 'ja',
      fallbackLang: 'ja',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
    }),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {floatLabel: 'always', appearance: 'outline'},
    },
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'ja-JP',
    },
  ],
};
