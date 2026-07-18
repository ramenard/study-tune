import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion — StudyTune',
    loadComponent: () => import('@features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    title: 'Inscription — StudyTune',
    loadComponent: () => import('@features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('@layout/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Accueil — StudyTune',
        loadComponent: () => import('@features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'generate',
        title: 'Générer — StudyTune',
        loadComponent: () => import('@features/generate/generate.component').then(m => m.GenerateComponent)
      },
      {
        path: 'library',
        title: 'Bibliothèque — StudyTune',
        loadComponent: () => import('@features/library/library.component').then(m => m.LibraryComponent)
      },
      {
        path: 'playlists',
        title: 'Playlists — StudyTune',
        loadComponent: () => import('@features/playlists/playlists.component').then(m => m.PlaylistsComponent)
      },
      {
        path: 'friends',
        title: 'Amis — StudyTune',
        loadComponent: () => import('@features/friends/friends.component').then(m => m.FriendsComponent)
      },
      {
        path: 'tokens',
        title: 'Abonnement — StudyTune',
        loadComponent: () => import('@features/tokens/tokens.component').then(m => m.TokensComponent)
      },
      {
        path: 'profile',
        title: 'Profil — StudyTune',
        loadComponent: () => import('@features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: '**',
        title: 'Page introuvable — StudyTune',
        loadComponent: () => import('@features/not-found/not-found.component').then(m => m.NotFoundComponent)
      }
    ]
  }
];
