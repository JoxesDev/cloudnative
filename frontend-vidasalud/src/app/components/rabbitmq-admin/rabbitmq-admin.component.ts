import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RabbitmqService } from '../../services/rabbitmq.service';
import {
  QueueSummary,
  ExchangeSummary,
  BindingSummary,
  CreateQueuePayload,
  CreateExchangePayload,
  CreateBindingPayload,
  PublishTestPayload,
  ProcessedMessageLog
} from '../../models/rabbitmq.model';

@Component({
  selector: 'app-rabbitmq-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- Encabezado Principal -->
      <div class="page-header">
        <div class="header-titles">
          <h1>
            <span class="icon-rabbit">🐇</span> Administración y Monitoreo RabbitMQ
          </h1>
          <p class="subtitle">
            Gestión dinámica de topología AMQP, tareas asíncronas desacopladas y trazabilidad de Dead Letter Queues (DLQ)
          </p>
        </div>
        <div class="header-actions">
          <button (click)="refreshAll()" class="btn-refresh" [disabled]="loading">
            <span [class.spinning]="loading">🔄</span> Actualizar Estado
          </button>
        </div>
      </div>

      <!-- Métricas Rápidas -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon queue-icon">📬</div>
          <div class="kpi-details">
            <span class="kpi-value">{{ queues.length }}</span>
            <span class="kpi-label">Colas Declaradas</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon dlq-icon">⚠️</div>
          <div class="kpi-details">
            <span class="kpi-value">{{ countDlqQueues() }}</span>
            <span class="kpi-label">Colas DLQ (Dead Letter)</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon exchange-icon">🔀</div>
          <div class="kpi-details">
            <span class="kpi-value">{{ exchanges.length }}</span>
            <span class="kpi-label">Exchanges Activos</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon binding-icon">🔗</div>
          <div class="kpi-details">
            <span class="kpi-value">{{ bindings.length }}</span>
            <span class="kpi-label">Bindings (Rutas)</span>
          </div>
        </div>
      </div>

      <!-- Alertas / Notificaciones -->
      <div *ngIf="alertMessage" class="alert-box" [ngClass]="alertType">
        <span>{{ alertMessage }}</span>
        <button (click)="alertMessage = null" class="btn-close-alert">✕</button>
      </div>

      <!-- Pestañas de Navegación -->
      <div class="tabs-nav">
        <button [class.active]="activeTab === 'topology'" (click)="activeTab = 'topology'" class="tab-btn">
          📐 Topología (Colas & Exchanges)
        </button>
        <button [class.active]="activeTab === 'simulator'" (click)="activeTab = 'simulator'" class="tab-btn">
          🧪 Simulador de Mensajería & DLQ
        </button>
        <button [class.active]="activeTab === 'logs'" (click)="activeTab = 'logs'" class="tab-btn">
          📋 Trazabilidad de Auditoría ({{ logs.length }})
        </button>
      </div>

      <!-- TAB 1: TOPOLOGÍA -->
      <div *ngIf="activeTab === 'topology'" class="tab-content">
        <!-- SECCIÓN COLAS -->
        <div class="section-card">
          <div class="section-header">
            <h2>Colas de Mensajería (Queues)</h2>
            <button (click)="showNewQueueModal = true" class="btn-primary">+ Nueva Cola</button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre de Cola</th>
                  <th>Tipo</th>
                  <th>Durable</th>
                  <th>Mensajes</th>
                  <th>Consumidores</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let q of queues">
                  <td class="font-mono">
                    <strong>{{ q.name }}</strong>
                    <span *ngIf="q.dlq" class="badge-dlq">DLQ</span>
                  </td>
                  <td>{{ q.dlq ? 'Dead Letter Queue' : 'Cola Principal' }}</td>
                  <td>
                    <span class="status-indicator" [class.active]="q.durable">{{ q.durable ? 'Sí' : 'No' }}</span>
                  </td>
                  <td><span class="badge-count">{{ q.messageCount }}</span></td>
                  <td><span class="badge-count">{{ q.consumerCount }}</span></td>
                  <td>
                    <button (click)="onDeleteQueue(q.name)" class="btn-delete" title="Eliminar cola">
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
                <tr *ngIf="queues.length === 0">
                  <td colspan="6" class="text-center empty-state">No hay colas registradas.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SECCIÓN EXCHANGES Y BINDINGS EN GRID -->
        <div class="grid-two-columns">
          <!-- EXCHANGES -->
          <div class="section-card">
            <div class="section-header">
              <h2>Exchanges</h2>
              <button (click)="showNewExchangeModal = true" class="btn-secondary">+ Nuevo Exchange</button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ex of exchanges">
                  <td class="font-mono">{{ ex.name }}</td>
                  <td><span class="badge-type">{{ ex.type }}</span></td>
                  <td>
                    <button (click)="onDeleteExchange(ex.name)" class="btn-delete-small">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- BINDINGS -->
          <div class="section-card">
            <div class="section-header">
              <h2>Bindings (Rutas)</h2>
              <button (click)="showNewBindingModal = true" class="btn-secondary">+ Nuevo Binding</button>
            </div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cola Destino</th>
                  <th>Exchange</th>
                  <th>Routing Key</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of bindings">
                  <td class="font-mono">{{ b.queueName }}</td>
                  <td class="font-mono">{{ b.exchangeName }}</td>
                  <td class="font-mono"><span class="badge-rk">{{ b.routingKey }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: SIMULADOR DE MENSAJERÍA & DLQ -->
      <div *ngIf="activeTab === 'simulator'" class="tab-content">
        <div class="section-card">
          <h2>Simulador de Tareas Asíncronas y Confirmación (ACK / NACK / DLQ)</h2>
          <p class="description">
            Esta herramienta permite comprobar en vivo la entrega desacoplada a consumidores (@RabbitListener)
            con confirmación manual explícita (ACK) y el desvío directo a la Dead Letter Queue (DLQ) mediante NACK.
          </p>

          <form (ngSubmit)="sendTestMessage()" class="sim-form">
            <div class="form-row">
              <div class="form-group">
                <label>Exchange Destino:</label>
                <input type="text" [(ngModel)]="simPayload.exchange" name="simExchange" class="form-input" required />
              </div>
              <div class="form-group">
                <label>Routing Key:</label>
                <select [(ngModel)]="simPayload.routingKey" name="simRk" class="form-input">
                  <option value="appointment.notification">appointment.notification (Notificaciones a Pacientes)</option>
                  <option value="appointment.ticket">appointment.ticket (Generación de Tickets Médicos)</option>
                  <option value="appointment.audit">appointment.audit (Auditoría de Atenciones)</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>RUT del Paciente:</label>
                <input type="text" [(ngModel)]="simPayload.patientRut" name="simRut" class="form-input" />
              </div>
              <div class="form-group">
                <label>ID de Atención Médica:</label>
                <input type="number" [(ngModel)]="simPayload.appointmentId" name="simId" class="form-input" />
              </div>
            </div>

            <!-- Switch para simular error hacia DLQ -->
            <div class="error-toggle-container">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="simPayload.simulateError" name="simError" />
                <span class="slider round"></span>
              </label>
              <div class="toggle-description">
                <strong>Simular Error Crítico en Consumidor (Prueba de Dead Letter Queue - DLQ)</strong>
                <p>
                  Cuando está activo, el consumidor forzará un fallo y enviará <code>channel.basicNack(deliveryTag, false, false)</code>,
                  haciendo que RabbitMQ derive automáticamente el mensaje a la cola <code>*.dlq</code>.
                </p>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-publish" [disabled]="loading">
                🚀 Enviar Mensaje a RabbitMQ
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB 3: LOGS Y TRAZABILIDAD -->
      <div *ngIf="activeTab === 'logs'" class="tab-content">
        <div class="section-card">
          <div class="section-header">
            <h2>Historial de Auditoría de Mensajes y Dead Letter Queues</h2>
            <div class="actions-group">
              <button (click)="refreshLogs()" class="btn-secondary">🔄 Recargar</button>
              <button (click)="onClearLogs()" class="btn-delete">🧹 Limpiar</button>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cola AMQP</th>
                  <th>Atención ID</th>
                  <th>Paciente RUT</th>
                  <th>Estado</th>
                  <th>Acción</th>
                  <th>Detalles</th>
                  <th>Tag</th>
                  <th>Fecha/Hora</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of logs">
                  <td class="font-mono">{{ item.id }}</td>
                  <td class="font-mono">
                    <span [class.badge-dlq-text]="item.queue.includes('dlq')">{{ item.queue }}</span>
                  </td>
                  <td><strong>#{{ item.appointmentId }}</strong></td>
                  <td>{{ item.patientRut }}</td>
                  <td>
                    <span class="badge-status" [ngClass]="item.status">
                      {{ item.status }}
                    </span>
                  </td>
                  <td>{{ item.action }}</td>
                  <td class="text-truncate" [title]="item.details">{{ item.details }}</td>
                  <td><code>{{ item.deliveryTag }}</code></td>
                  <td class="text-muted">{{ item.timestamp | slice:0:19 }}</td>
                </tr>
                <tr *ngIf="logs.length === 0">
                  <td colspan="9" class="text-center empty-state">
                    No se han registrado mensajes procesados todavía. Usa el simulador o crea una atención médica para disparar eventos.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL CREAR COLA -->
      <div *ngIf="showNewQueueModal" class="modal-backdrop">
        <div class="modal-box">
          <h3>Crear Nueva Cola AMQP</h3>
          <p class="modal-sub">Valida parámetros para evitar nombres vacíos o configuraciones inválidas.</p>

          <form (ngSubmit)="submitCreateQueue()">
            <div class="form-group">
              <label>Nombre de la Cola: *</label>
              <input type="text" [(ngModel)]="newQueue.name" name="qName" required class="form-input" placeholder="ej. vidasalud.reportes.queue" />
              <small class="hint">Solo letras, números, puntos y guiones.</small>
            </div>

            <div class="form-group checkbox-group">
              <label><input type="checkbox" [(ngModel)]="newQueue.durable" name="qDurable" /> Durable (persiste en disco)</label>
            </div>

            <div class="form-group">
              <label>Dead Letter Exchange (Opcional):</label>
              <input type="text" [(ngModel)]="newQueue.deadLetterExchange" name="qDlx" class="form-input" placeholder="vidasalud.dlx.exchange" />
            </div>

            <div class="form-group">
              <label>Dead Letter Routing Key (Opcional):</label>
              <input type="text" [(ngModel)]="newQueue.deadLetterRoutingKey" name="qDlxRk" class="form-input" placeholder="reportes.dlq" />
            </div>

            <div class="modal-buttons">
              <button type="button" (click)="showNewQueueModal = false" class="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!newQueue.name">Crear Cola</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CREAR EXCHANGE -->
      <div *ngIf="showNewExchangeModal" class="modal-backdrop">
        <div class="modal-box">
          <h3>Crear Nuevo Exchange</h3>
          <form (ngSubmit)="submitCreateExchange()">
            <div class="form-group">
              <label>Nombre del Exchange: *</label>
              <input type="text" [(ngModel)]="newExchange.name" name="exName" required class="form-input" placeholder="ej. vidasalud.topic.exchange" />
            </div>
            <div class="form-group">
              <label>Tipo de Exchange: *</label>
              <select [(ngModel)]="newExchange.type" name="exType" class="form-input">
                <option value="direct">direct</option>
                <option value="topic">topic</option>
                <option value="fanout">fanout</option>
                <option value="headers">headers</option>
              </select>
            </div>
            <div class="modal-buttons">
              <button type="button" (click)="showNewExchangeModal = false" class="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!newExchange.name">Crear Exchange</button>
            </div>
          </form>
        </div>
      </div>

      <!-- MODAL CREAR BINDING -->
      <div *ngIf="showNewBindingModal" class="modal-backdrop">
        <div class="modal-box">
          <h3>Crear Nuevo Binding (Enlace)</h3>
          <form (ngSubmit)="submitCreateBinding()">
            <div class="form-group">
              <label>Cola: *</label>
              <input type="text" [(ngModel)]="newBinding.queueName" name="bQueue" required class="form-input" placeholder="Nombre de la cola" />
            </div>
            <div class="form-group">
              <label>Exchange: *</label>
              <input type="text" [(ngModel)]="newBinding.exchangeName" name="bEx" required class="form-input" placeholder="Nombre del exchange" />
            </div>
            <div class="form-group">
              <label>Routing Key: *</label>
              <input type="text" [(ngModel)]="newBinding.routingKey" name="bRk" required class="form-input" placeholder="Routing key" />
            </div>
            <div class="modal-buttons">
              <button type="button" (click)="showNewBindingModal = false" class="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="!newBinding.queueName || !newBinding.exchangeName || !newBinding.routingKey">Crear Enlace</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-container {
      max-width: 1250px;
      margin: 2rem auto;
      padding: 0 1.5rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-titles h1 {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }
    .subtitle {
      color: #64748b;
      margin-top: 0.35rem;
      font-size: 0.95rem;
    }
    .btn-refresh {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #334155;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn-refresh:hover { background: #e2e8f0; }
    .spinning { animation: spin 1s infinite linear; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* KPIs */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
    }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .queue-icon { background: #e0f2fe; }
    .dlq-icon { background: #fee2e2; }
    .exchange-icon { background: #fef3c7; }
    .binding-icon { background: #f3e8ff; }
    .kpi-details { display: flex; flex-direction: column; }
    .kpi-value { font-size: 1.7rem; font-weight: 800; color: #0f172a; line-height: 1.2; }
    .kpi-label { font-size: 0.8rem; color: #64748b; font-weight: 500; }

    /* Tabs */
    .tabs-nav {
      display: flex;
      gap: 0.75rem;
      border-bottom: 2px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 1.25rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s;
    }
    .tab-btn.active {
      color: #0284c7;
      border-bottom-color: #0284c7;
    }

    /* Cards */
    .section-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      margin-bottom: 1.5rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .section-header h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin: 0; }
    .grid-two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    /* Tablas */
    .table-responsive { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .font-mono { font-family: monospace; font-size: 0.85rem; }
    .badge-dlq {
      background: #dc2626;
      color: white;
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      margin-left: 0.5rem;
      font-weight: bold;
    }
    .badge-dlq-text { color: #dc2626; font-weight: bold; }
    .badge-count {
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-weight: 700;
      color: #334155;
    }
    .badge-type {
      background: #fef3c7;
      color: #92400e;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.8rem;
    }
    .badge-rk {
      background: #f3e8ff;
      color: #6b21a8;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .badge-status {
      font-size: 0.72rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
    }
    .badge-status.ACK_SUCCESS { background: #dcfce7; color: #166534; }
    .badge-status.NACK_TO_DLQ { background: #fee2e2; color: #991b1b; }
    .badge-status.DEAD_LETTER_CAPTURED { background: #ffedd5; color: #9a3412; }

    /* Botones */
    .btn-primary {
      background: #0284c7;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary:hover { background: #0369a1; }
    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 0.9rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-delete {
      background: #fee2e2;
      color: #dc2626;
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-delete:hover { background: #fecaca; }
    .btn-delete-small { background: none; border: none; cursor: pointer; font-size: 1rem; }

    /* Simulador Form */
    .sim-form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #334155; }
    .form-input {
      padding: 0.6rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    .error-toggle-container {
      background: #fff7ed;
      border: 1px solid #fdba74;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .toggle-description strong { color: #c2410c; display: block; font-size: 0.95rem; }
    .toggle-description p { margin: 0.25rem 0 0; color: #9a3412; font-size: 0.82rem; }
    .btn-publish {
      background: #16a34a;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
    }
    .btn-publish:hover { background: #15803d; }

    /* Switch */
    .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 34px; }
    .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #ea580c; }
    input:checked + .slider:before { transform: translateX(24px); }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-box {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    }
    .modal-sub { color: #64748b; font-size: 0.85rem; margin-top: -0.5rem; margin-bottom: 1.25rem; }
    .modal-buttons { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-cancel { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }

    /* Alert */
    .alert-box {
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 500;
    }
    .alert-box.success { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .alert-box.error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .btn-close-alert { background: none; border: none; font-size: 1.1rem; cursor: pointer; }
    .empty-state { color: #94a3b8; padding: 2rem !important; }
  `]
})
export class RabbitmqAdminComponent implements OnInit {
  private rabbitmqService = inject(RabbitmqService);

  activeTab: 'topology' | 'simulator' | 'logs' = 'topology';
  loading = false;
  alertMessage: string | null = null;
  alertType: 'success' | 'error' = 'success';

  queues: QueueSummary[] = [];
  exchanges: ExchangeSummary[] = [];
  bindings: BindingSummary[] = [];
  logs: ProcessedMessageLog[] = [];

  // Modals
  showNewQueueModal = false;
  showNewExchangeModal = false;
  showNewBindingModal = false;

  newQueue: CreateQueuePayload = {
    name: '',
    durable: true,
    exclusive: false,
    autoDelete: false,
    deadLetterExchange: 'vidasalud.dlx.exchange',
    deadLetterRoutingKey: ''
  };

  newExchange: CreateExchangePayload = {
    name: '',
    type: 'direct',
    durable: true,
    autoDelete: false
  };

  newBinding: CreateBindingPayload = {
    queueName: '',
    exchangeName: 'vidasalud.direct.exchange',
    routingKey: ''
  };

  simPayload: PublishTestPayload = {
    exchange: 'vidasalud.direct.exchange',
    routingKey: 'appointment.notification',
    patientRut: '12.345.678-9',
    appointmentId: 101,
    simulateError: false
  };

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.loading = true;
    this.rabbitmqService.getQueues().subscribe({
      next: (q) => { this.queues = q; this.loading = false; },
      error: (err) => { this.loading = false; this.showAlert('Error al cargar colas: ' + (err.message || 'Error de conexión'), 'error'); }
    });

    this.rabbitmqService.getExchanges().subscribe({
      next: (ex) => { this.exchanges = ex; },
      error: () => {}
    });

    this.rabbitmqService.getBindings().subscribe({
      next: (b) => { this.bindings = b; },
      error: () => {}
    });

    this.refreshLogs();
  }

  refreshLogs() {
    this.rabbitmqService.getLogs().subscribe({
      next: (data) => { this.logs = data; },
      error: () => {}
    });
  }

  countDlqQueues(): number {
    return this.queues.filter(q => q.dlq).length;
  }

  onDeleteQueue(queueName: string) {
    if (!confirm(`¿Eliminar la cola '${queueName}'?`)) return;
    this.rabbitmqService.deleteQueue(queueName).subscribe({
      next: () => {
        this.showAlert(`Cola '${queueName}' eliminada exitosamente`, 'success');
        this.refreshAll();
      },
      error: (err) => this.showAlert('Error al eliminar cola: ' + err.message, 'error')
    });
  }

  onDeleteExchange(exchangeName: string) {
    if (!confirm(`¿Eliminar el exchange '${exchangeName}'?`)) return;
    this.rabbitmqService.deleteExchange(exchangeName).subscribe({
      next: () => {
        this.showAlert(`Exchange '${exchangeName}' eliminado exitosamente`, 'success');
        this.refreshAll();
      },
      error: (err) => this.showAlert('Error al eliminar exchange: ' + err.message, 'error')
    });
  }

  submitCreateQueue() {
    if (!this.newQueue.name.trim()) {
      this.showAlert('El nombre de la cola es obligatorio', 'error');
      return;
    }
    this.rabbitmqService.createQueue(this.newQueue).subscribe({
      next: () => {
        this.showAlert(`Cola '${this.newQueue.name}' creada exitosamente`, 'success');
        this.showNewQueueModal = false;
        this.newQueue = { name: '', durable: true, exclusive: false, autoDelete: false, deadLetterExchange: 'vidasalud.dlx.exchange', deadLetterRoutingKey: '' };
        this.refreshAll();
      },
      error: (err) => this.showAlert('Error al crear cola: ' + (err.error?.message || err.message), 'error')
    });
  }

  submitCreateExchange() {
    if (!this.newExchange.name.trim()) return;
    this.rabbitmqService.createExchange(this.newExchange).subscribe({
      next: () => {
        this.showAlert(`Exchange '${this.newExchange.name}' creado exitosamente`, 'success');
        this.showNewExchangeModal = false;
        this.newExchange = { name: '', type: 'direct', durable: true, autoDelete: false };
        this.refreshAll();
      },
      error: (err) => this.showAlert('Error al crear exchange: ' + err.message, 'error')
    });
  }

  submitCreateBinding() {
    if (!this.newBinding.queueName || !this.newBinding.exchangeName || !this.newBinding.routingKey) return;
    this.rabbitmqService.createBinding(this.newBinding).subscribe({
      next: () => {
        this.showAlert('Enlace creado con éxito', 'success');
        this.showNewBindingModal = false;
        this.newBinding = { queueName: '', exchangeName: 'vidasalud.direct.exchange', routingKey: '' };
        this.refreshAll();
      },
      error: (err) => this.showAlert('Error al crear binding: ' + err.message, 'error')
    });
  }

  sendTestMessage() {
    this.loading = true;
    this.rabbitmqService.publishTestMessage(this.simPayload).subscribe({
      next: (res) => {
        this.loading = false;
        this.showAlert(res.message, this.simPayload.simulateError ? 'error' : 'success');
        // Esperar breve momento para que el consumidor procese y refrescar logs
        setTimeout(() => this.refreshLogs(), 800);
      },
      error: (err) => {
        this.loading = false;
        this.showAlert('Error al publicar mensaje: ' + err.message, 'error');
      }
    });
  }

  onClearLogs() {
    this.rabbitmqService.clearLogs().subscribe({
      next: () => {
        this.logs = [];
        this.showAlert('Historial de logs limpiado', 'success');
      }
    });
  }

  private showAlert(msg: string, type: 'success' | 'error') {
    this.alertMessage = msg;
    this.alertType = type;
    setTimeout(() => { if (this.alertMessage === msg) this.alertMessage = null; }, 6000);
  }
}
