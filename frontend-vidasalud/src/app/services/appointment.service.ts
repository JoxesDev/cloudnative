import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Appointment, CreateAppointmentDto, TransitionStatusDto } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.msal.apiUri}/api/appointments`;

  getAppointments(patientRut?: string, status?: string): Observable<Appointment[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (patientRut) params.push(`patientRut=${encodeURIComponent(patientRut)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<Appointment[]>(url);
  }

  getAppointmentById(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  createAppointment(dto: CreateAppointmentDto): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, dto);
  }

  transitionStatus(id: number, nextStatus: string): Observable<Appointment> {
    const payload: TransitionStatusDto = { nextStatus: nextStatus as any };
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/status`, payload);
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
