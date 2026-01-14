import {bootstrapApplication} from '@angular/platform-browser';
import {appConfig} from './app/app.config';
import {AppComponent} from './app/components/app.component';
import {environment} from './environments/environment';

// Log the environment configuration
console.log('Application is running with environment:', environment);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
