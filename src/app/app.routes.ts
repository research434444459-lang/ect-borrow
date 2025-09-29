import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

// ----- User pages (อิงชื่อไฟล์/คลาสตามโปรเจกต์คุณ) -----
import { MenuComponent } from './pages/menu/menu';
import { DevicesComponent } from './pages/devices/devices';
import { DeviceCategoryComponent } from './pages/device-category/device-category';
import { RequestsComponent } from './pages/requests/requests';
import { RequestDetailComponent } from './pages/request-detail/request-detail';

// ----- Routes -----
export const routes: Routes = [
  // Admin (ไม่มี navbar)
  {
    path: 'admin',
    children: [
      { path: 'login', loadComponent: () => import('./pages/admin-login/admin-login').then(m => m.AdminLoginComponent) },
      { path: 'requests', loadComponent: () => import('./pages/admin-requests/admin-requests').then(m => m.AdminRequestsComponent) },
      { path: 'request-detail/:id', loadComponent: () => import('./pages/admin-request-detail/admin-request-detail').then(m => m.AdminRequestDetailComponent) },
      { path: '', redirectTo: 'requests', pathMatch: 'full' },
    ]
  },

  // User (มี navbar ผ่าน Shell)
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: MenuComponent, pathMatch: 'full' },
      { path: 'devices/:category', component: DeviceCategoryComponent },
      { path: 'devices', component: DevicesComponent },
      {
        path: 'forecast',
        loadComponent: () => import('./pages/forecast/forecast').then(m => m.ForecastPage),
      },
      { path: 'requests/:studentId/:date', component: RequestDetailComponent },
      { path: 'requests', component: RequestsComponent },

      // ถ้า "แบบฟอร์มการยืมคืน" เป็นเพจภายใน ให้ปลดคอมเมนต์ + สร้างไฟล์จริง
      // {
      //   path: 'forms/borrow-return',
      //   loadComponent: () => import('./pages/forms/borrow-return').then(m => m.BorrowReturnFormPage)
      // },
    ]
  },

  { path: '**', redirectTo: '' },
];
