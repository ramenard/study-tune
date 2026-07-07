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