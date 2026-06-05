import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { GamesComponent } from './games-component/games-component';
import { GamePlayComponent } from './game-play/game-play';

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
    path: 'signup',
    component: SignupComponent,
    title: 'ENIGMA – Registrati'
  },
  {
    path: 'leaderboard',
    component: LeaderboardComponent,
    title: 'ENIGMA – Classifica'
  },
  {
    path: 'games',
    component: GamesComponent,
    title: 'ENIGMA – Enigmi'
  },
  {
    path: 'games/:id',
    component: GamePlayComponent,
    title: 'ENIGMA – Gioca'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
