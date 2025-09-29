import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

// ----- User pages -----
import { MenuComponent } from './pages/menu/menu';
import { DevicesComponent } from './pages/devices/devices';
import { DeviceCategoryComponent } from './pages/device-category/device-category';
import { RequestsComponent } from './pages/requests/requests';
import { RequestDetailComponent } from './pages/request-detail/request-detail';

export const routes: Routes = [
  // ----- Admin (ไม่มี Shell ผู้ใช้) -----
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./pages/admin-login/admin-login').then(m => m.AdminLoginComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'today',
        loadComponent: () =>
          import('./pages/admin-today/admin-today').then(m => m.AdminTodayComponent),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/admin-requests/admin-requests').then(m => m.AdminRequestsComponent),
      },
      {
        path: 'request-detail/:studentId/:date',
        loadComponent: () =>
          import('./pages/admin-request-detail/admin-request-detail').then(
            m => m.AdminRequestDetailComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ----- User (มี Shell) -----
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: MenuComponent, pathMatch: 'full' },
      { path: 'devices/:category', component: DeviceCategoryComponent },
      { path: 'devices', component: DevicesComponent },
      {
        path: 'forecast',
        loadComponent: () =>
          import('./pages/forecast/forecast').then(m => m.ForecastPage),
      },
      { path: 'requests/:studentId/:date', component: RequestDetailComponent },
      { path: 'requests', component: RequestsComponent },
    ],
  },

  { path: '**', redirectTo: '' },
];
