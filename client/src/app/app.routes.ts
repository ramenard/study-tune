import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'generate',
        loadComponent: () => import('./pages/generate/generate.component').then(m => m.GenerateComponent)
      },
      {
        path: 'library',
        loadComponent: () => import('./pages/library/library.component').then(m => m.LibraryComponent)
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];