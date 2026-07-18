import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion — StudyTune',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    title: 'Inscription — StudyTune',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Accueil — StudyTune',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'generate',
        title: 'Générer — StudyTune',
        loadComponent: () => import('./pages/generate/generate.component').then(m => m.GenerateComponent)
      },
      {
        path: 'library',
        title: 'Bibliothèque — StudyTune',
        loadComponent: () => import('./pages/library/library.component').then(m => m.LibraryComponent)
      },
      {
        path: 'playlists',
        title: 'Playlists — StudyTune',
        loadComponent: () => import('./pages/playlists/playlists.component').then(m => m.PlaylistsComponent)
      },
      {
        path: 'friends',
        title: 'Amis — StudyTune',
        loadComponent: () => import('./pages/friends/friends.component').then(m => m.FriendsComponent)
      },
      {
        path: 'tokens',
        title: 'Abonnement — StudyTune',
        loadComponent: () => import('./pages/tokens/tokens.component').then(m => m.TokensComponent)
      },
      {
        path: 'profile',
        title: 'Profil — StudyTune',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: '**',
        title: 'Page introuvable — StudyTune',
        loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
      }
    ]
  }
];
