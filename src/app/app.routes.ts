import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home-map-poc',
    loadComponent: () =>
      import('./home-map-poc/home-map-poc.component').then(
        (component) => component.HomeMapPocComponent,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'home-map-poc' },
  { path: '**', redirectTo: 'home-map-poc' },
];
