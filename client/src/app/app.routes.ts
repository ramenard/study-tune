import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
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
        path: 'playlists',
        loadComponent: () => import('./pages/playlists/playlists.component').then(m => m.PlaylistsComponent)
      },
      {
        path: 'friends',
        loadComponent: () => import('./pages/friends/friends.component').then(m => m.FriendsComponent)
      },
      {
        path: 'tokens',
        loadComponent: () => import('./pages/tokens/tokens.component').then(m => m.TokensComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];
