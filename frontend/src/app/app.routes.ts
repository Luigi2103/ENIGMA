import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'ENIGMA – Home'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'ENIGMA – Accedi'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
