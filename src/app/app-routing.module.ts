import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {
  RegisterForVaccinationComponent
} from './components/register-for-vaccination/register-for-vaccination.component';
import {HomeComponent} from './components/home/home.component';
import {CancelRegistrationComponent} from './components/cancel-registration/cancel-registration.component';

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
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
