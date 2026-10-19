import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  QueueSummary,
  ExchangeSummary,
  BindingSummary,
  CreateQueuePayload,
  CreateExchangePayload,
  CreateBindingPayload,
  PublishTestPayload,
  ProcessedMessageLog
} from '../models/rabbitmq.model';

const API_TIMEOUT_MS = 4000;

@Injectable({
  providedIn: 'root'
})
export class RabbitmqService {
  private http = inject(HttpClient);
  private bffUrl = `${environment.msal.apiUri}/api/admin`;
  private directUrl = 'http://localhost:8083/api/admin';

  private get baseUrl(): string {
    const devRole = localStorage.getItem('vidasalud_dev_role');
    if (devRole && devRole !== 'RESET') {
      return this.directUrl;
    }
    return this.bffUrl;
  }

  getQueues(): Observable<QueueSummary[]> {
    return this.http.get<QueueSummary[]>(`${this.baseUrl}/queues`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.get<QueueSummary[]>(`${this.directUrl}/queues`))
    );
  }

  createQueue(payload: CreateQueuePayload): Observable<QueueSummary> {
    return this.http.post<QueueSummary>(`${this.baseUrl}/queues`, payload).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.post<QueueSummary>(`${this.directUrl}/queues`, payload))
    );
  }

  deleteQueue(queueName: string): Observable<{ queue: string; deleted: boolean; message: string }> {
    return this.http.delete<{ queue: string; deleted: boolean; message: string }>(`${this.baseUrl}/queues/${queueName}`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.delete<{ queue: string; deleted: boolean; message: string }>(`${this.directUrl}/queues/${queueName}`))
    );
  }

  getExchanges(): Observable<ExchangeSummary[]> {
    return this.http.get<ExchangeSummary[]>(`${this.baseUrl}/exchanges`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.get<ExchangeSummary[]>(`${this.directUrl}/exchanges`))
    );
  }

  createExchange(payload: CreateExchangePayload): Observable<ExchangeSummary> {
    return this.http.post<ExchangeSummary>(`${this.baseUrl}/exchanges`, payload).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.post<ExchangeSummary>(`${this.directUrl}/exchanges`, payload))
    );
  }

  deleteExchange(exchangeName: string): Observable<{ exchange: string; deleted: boolean; message: string }> {
    return this.http.delete<{ exchange: string; deleted: boolean; message: string }>(`${this.baseUrl}/exchanges/${exchangeName}`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.delete<{ exchange: string; deleted: boolean; message: string }>(`${this.directUrl}/exchanges/${exchangeName}`))
    );
  }

  getBindings(): Observable<BindingSummary[]> {
    return this.http.get<BindingSummary[]>(`${this.baseUrl}/bindings`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.get<BindingSummary[]>(`${this.directUrl}/bindings`))
    );
  }

  createBinding(payload: CreateBindingPayload): Observable<BindingSummary> {
    return this.http.post<BindingSummary>(`${this.baseUrl}/bindings`, payload).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.post<BindingSummary>(`${this.directUrl}/bindings`, payload))
    );
  }

  deleteBinding(payload: CreateBindingPayload): Observable<{ message: string }> {
    return this.http.request<{ message: string }>('delete', `${this.baseUrl}/bindings`, { body: payload }).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.request<{ message: string }>('delete', `${this.directUrl}/bindings`, { body: payload }))
    );
  }

  publishTestMessage(payload: PublishTestPayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/messages/publish`, payload).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.post<any>(`${this.directUrl}/messages/publish`, payload))
    );
  }

  getLogs(): Observable<ProcessedMessageLog[]> {
    return this.http.get<ProcessedMessageLog[]>(`${this.baseUrl}/logs`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.get<ProcessedMessageLog[]>(`${this.directUrl}/logs`))
    );
  }

  clearLogs(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/logs`).pipe(
      timeout(API_TIMEOUT_MS),
      catchError(() => this.http.delete<{ message: string }>(`${this.directUrl}/logs`))
    );
  }
}
