import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Appointment, CreateAppointmentDto, TransitionStatusDto } from '../models/appointment.model';

const API_TIMEOUT_MS = 5000;
const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : 'localhost';
const protocol = isBrowser ? window.location.protocol : 'http:';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private proxyUrl = '/api/appointments';
  private directUrl = `${protocol}//${host}:8081/api/appointments`;
  private bffUrl = `${environment.msal.apiUri}/api/appointments`;

  private get baseUrl(): string {
    const devRole = localStorage.getItem('vidasalud_dev_role');
    if (devRole && devRole !== 'RESET') {
      return this.proxyUrl;
    }
    return this.bffUrl;
  }

  getAppointments(patientRut?: string, status?: string): Observable<Appointment[]> {
    let url = this.baseUrl;
    const params: string[] = [];
    if (patientRut) params.push(`patientRut=${encodeURIComponent(patientRut)}`);
    if (status) params.push(`status=${encodeURIComponent(status)}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<Appointment[]>(url).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => {
        let fallbackUrl = this.directUrl;
        if (params.length > 0) fallbackUrl += `?${params.join('&')}`;
        return this.http.get<Appointment[]>(fallbackUrl);
      })
    );
  }

  getAppointmentById(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.baseUrl}/${id}`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.get<Appointment>(`${this.directUrl}/${id}`))
    );
  }

  createAppointment(dto: CreateAppointmentDto): Observable<Appointment> {
    return this.http.post<Appointment>(this.baseUrl, dto).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.post<Appointment>(this.directUrl, dto))
    );
  }

  transitionStatus(id: number, nextStatus: string): Observable<Appointment> {
    const payload: TransitionStatusDto = { nextStatus: nextStatus as any };
    return this.http.patch<Appointment>(`${this.baseUrl}/${id}/status`, payload).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.patch<Appointment>(`${this.directUrl}/${id}/status`, payload))
    );
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.delete<void>(`${this.directUrl}/${id}`))
    );
  }
}
