import { Routes } from '@angular/router';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { CatalogComponent } from './components/catalog/catalog.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { LoginComponent } from './components/login/login.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'appointments',
    pathMatch: 'full'
  },
  {
    path: 'appointments',
    component: AppointmentsComponent,
    canActivate: [roleGuard(['Admin', 'Recepcionista', 'Paciente'])]
  },
  {
    path: 'catalog',
    component: CatalogComponent,
    canActivate: [roleGuard(['Admin', 'Recepcionista'])]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: '**',
    redirectTo: 'appointments'
  }
];
