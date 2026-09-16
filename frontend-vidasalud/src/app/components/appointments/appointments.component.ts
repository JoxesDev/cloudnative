import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { AuthService } from '../../services/auth.service';
import { Appointment, AppointmentStatus, CreateAppointmentDto } from '../../models/appointment.model';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Encabezado y KPIs -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Atenciones Médicas</h1>
          <p class="page-desc">Control de ciclo de vida de atención ambulatoria - VidaSalud</p>
        </div>
        <button (click)="openCreateModal()" class="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Atención
        </button>
      </div>

      <!-- Notificaciones / Alertas -->
      <div *ngIf="alertMessage" [class]="'alert alert-' + alertType">
        <div class="alert-content">
          <span>{{ alertMessage }}</span>
        </div>
        <button (click)="alertMessage = null" class="btn-close-alert">×</button>
      </div>

      <!-- Tarjetas de Resumen KPI -->
      <div class="kpi-grid">
        <div class="kpi-card kpi-total">
          <span class="kpi-title">Total Atenciones</span>
          <span class="kpi-value">{{ appointments.length }}</span>
        </div>
        <div class="kpi-card kpi-solicitada">
          <span class="kpi-title">Solicitadas</span>
          <span class="kpi-value">{{ countByStatus('SOLICITADA') }}</span>
        </div>
        <div class="kpi-card kpi-confirmada">
          <span class="kpi-title">Confirmadas</span>
          <span class="kpi-value">{{ countByStatus('CONFIRMADA') }}</span>
        </div>
        <div class="kpi-card kpi-espera">
          <span class="kpi-title">En Espera</span>
          <span class="kpi-value">{{ countByStatus('EN_ESPERA') }}</span>
        </div>
        <div class="kpi-card kpi-atencion">
          <span class="kpi-title">En Atención</span>
          <span class="kpi-value">{{ countByStatus('EN_ATENCION') }}</span>
        </div>
        <div class="kpi-card kpi-cerrada">
          <span class="kpi-title">Cerradas</span>
          <span class="kpi-value">{{ countByStatus('CERRADA') }}</span>
        </div>
      </div>

      <!-- Guía Visual de la Máquina de Estados -->
      <div class="workflow-card">
        <div class="workflow-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Máquina de Estados de Atención (Regla canTransitionTo)
        </div>
        <div class="workflow-steps">
          <div class="step-pill">1. SOLICITADA</div>
          <span class="step-arrow">→</span>
          <div class="step-pill">2. CONFIRMADA</div>
          <span class="step-arrow">→</span>
          <div class="step-pill">3. EN_ESPERA</div>
          <span class="step-arrow">→</span>
          <div class="step-pill">4. EN_ATENCION</div>
          <span class="step-arrow">→</span>
          <div class="step-pill step-closed">5. CERRADA</div>
          <span class="step-divider">|</span>
          <div class="step-pill step-cancel">CANCELADA (desde 1 o 2)</div>
        </div>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="filter-bar">
        <div class="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            [(ngModel)]="searchRut"
            (ngModelChange)="applyFilter()"
            placeholder="Buscar por RUT paciente (ej: 12345678-9)..."
            class="input-search"
          />
        </div>

        <div class="status-filter">
          <label>Filtrar por Estado:</label>
          <select [(ngModel)]="selectedStatus" (change)="applyFilter()" class="select-filter">
            <option value="">Todos los estados</option>
            <option value="SOLICITADA">SOLICITADA</option>
            <option value="CONFIRMADA">CONFIRMADA</option>
            <option value="EN_ESPERA">EN_ESPERA</option>
            <option value="EN_ATENCION">EN_ATENCION</option>
            <option value="CERRADA">CERRADA</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>

        <button (click)="loadAppointments()" class="btn-refresh" title="Recargar datos">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Tabla de Atenciones -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>RUT Paciente</th>
              <th>Servicio</th>
              <th>Box</th>
              <th>Fecha y Hora</th>
              <th>Estado Actual</th>
              <th>Transiciones Disponibles</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredAppointments" [class]="'row-' + item.status.toLowerCase()">
              <td class="cell-id">#{{ item.id }}</td>
              <td class="cell-rut">
                <strong>{{ item.patientRut }}</strong>
              </td>
              <td>Servicio {{ item.serviceId }}</td>
              <td>
                <span class="box-tag">Box {{ item.boxId }}</span>
              </td>
              <td class="cell-date">{{ item.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <span class="status-badge" [ngClass]="item.status.toLowerCase()">
                  {{ item.status }}
                </span>
              </td>
              <td class="cell-actions">
                <div class="action-buttons">
                  <!-- Transiciones permitidas desde SOLICITADA -->
                  <ng-container *ngIf="item.status === 'SOLICITADA'">
                    <button (click)="changeStatus(item, 'CONFIRMADA')" class="btn-action btn-confirm">
                      Confirmar
                    </button>
                    <button (click)="changeStatus(item, 'CANCELADA')" class="btn-action btn-cancel">
                      Cancelar
                    </button>
                  </ng-container>

                  <!-- Transiciones permitidas desde CONFIRMADA -->
                  <ng-container *ngIf="item.status === 'CONFIRMADA'">
                    <button (click)="changeStatus(item, 'EN_ESPERA')" class="btn-action btn-wait">
                      En Espera
                    </button>
                    <button (click)="changeStatus(item, 'CANCELADA')" class="btn-action btn-cancel">
                      Cancelar
                    </button>
                  </ng-container>

                  <!-- Transiciones permitidas desde EN_ESPERA -->
                  <ng-container *ngIf="item.status === 'EN_ESPERA'">
                    <button (click)="changeStatus(item, 'EN_ATENCION')" class="btn-action btn-attend">
                      Iniciar Atención
                    </button>
                  </ng-container>

                  <!-- Transiciones permitidas desde EN_ATENCION -->
                  <ng-container *ngIf="item.status === 'EN_ATENCION'">
                    <button (click)="changeStatus(item, 'CERRADA')" class="btn-action btn-close">
                      Cerrar Atención
                    </button>
                  </ng-container>

                  <!-- Estados finales -->
                  <ng-container *ngIf="item.status === 'CERRADA' || item.status === 'CANCELADA'">
                    <span class="final-state-label">Completado</span>
                  </ng-container>
                </div>
              </td>
            </tr>

            <tr *ngIf="filteredAppointments.length === 0">
              <td colspan="7" class="empty-state">
                <p>No se encontraron atenciones registradas con los filtros seleccionados.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Crear Atención -->
      <div class="modal-backdrop" *ngIf="showModal">
        <div class="modal-card">
          <div class="modal-header">
            <h2 class="modal-title">Registrar Nueva Atención Médica</h2>
            <button (click)="showModal = false" class="btn-close">×</button>
          </div>
          <form (ngSubmit)="submitCreate()">
            <div class="form-group">
              <label>RUT del Paciente *</label>
              <input
                type="text"
                [(ngModel)]="newAppointment.patientRut"
                name="patientRut"
                placeholder="Ej: 12345678-9"
                required
                class="form-control"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>ID Servicio Médico *</label>
                <select [(ngModel)]="newAppointment.serviceId" name="serviceId" class="form-control" required>
                  <option [value]="101">101 - Medicina General</option>
                  <option [value]="102">102 - Cardiología</option>
                  <option [value]="103">103 - Pediatría</option>
                  <option [value]="104">104 - Kinesiología</option>
                </select>
              </div>

              <div class="form-group">
                <label>ID Box de Atención *</label>
                <select [(ngModel)]="newAppointment.boxId" name="boxId" class="form-control" required>
                  <option [value]="1">Box 1 (Piso 1)</option>
                  <option [value]="2">Box 2 (Piso 1)</option>
                  <option [value]="3">Box 3 (Piso 2)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Fecha y Hora de la Atención *</label>
              <input
                type="datetime-local"
                [(ngModel)]="newAppointment.scheduledAt"
                name="scheduledAt"
                required
                class="form-control"
              />
            </div>

            <div class="modal-actions">
              <button type="button" (click)="showModal = false" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-primary">Guardar Atención</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1300px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .page-desc {
      color: #64748b;
      margin: 0.25rem 0 0 0;
      font-size: 0.95rem;
    }
    .btn-primary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: white;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
      transition: all 0.2s;
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, #0369a1, #075985);
      transform: translateY(-1px);
    }
    .alert {
      padding: 0.85rem 1.25rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .alert-success {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .alert-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .alert-info {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .btn-close-alert {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: inherit;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: white;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .kpi-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-value {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-solicitada .kpi-value { color: #f59e0b; }
    .kpi-confirmada .kpi-value { color: #3b82f6; }
    .kpi-espera .kpi-value { color: #8b5cf6; }
    .kpi-atencion .kpi-value { color: #0d9488; }
    .kpi-cerrada .kpi-value { color: #10b981; }

    .workflow-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }
    .workflow-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .workflow-steps {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .step-pill {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #1e293b;
    }
    .step-closed {
      background: #d1fae5;
      border-color: #6ee7b7;
      color: #065f46;
    }
    .step-cancel {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #991b1b;
    }
    .step-arrow {
      color: #94a3b8;
      font-weight: bold;
    }
    .step-divider {
      color: #cbd5e1;
      margin: 0 0.5rem;
    }

    .filter-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 250px;
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 0.5rem 0.85rem;
      gap: 0.5rem;
      color: #64748b;
    }
    .input-search {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.9rem;
    }
    .status-filter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #475569;
      font-weight: 500;
    }
    .select-filter {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #1e293b;
    }
    .btn-refresh {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: white;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-refresh:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .table-container {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow-x: auto;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.9rem 1.25rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9rem;
      color: #1e293b;
    }
    .cell-id {
      font-family: monospace;
      color: #64748b;
      font-weight: 600;
    }
    .cell-rut {
      color: #0f172a;
    }
    .box-tag {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.03em;
    }
    .status-badge.solicitada { background: #fef3c7; color: #92400e; }
    .status-badge.confirmada { background: #dbeafe; color: #1e40af; }
    .status-badge.en_espera { background: #ede9fe; color: #5b21b6; }
    .status-badge.en_atencion { background: #ccfbf1; color: #115e59; }
    .status-badge.cerrada { background: #d1fae5; color: #065f46; }
    .status-badge.cancelada { background: #fee2e2; color: #991b1b; }

    .action-buttons {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .btn-action {
      border: none;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-confirm { background: #2563eb; color: white; }
    .btn-confirm:hover { background: #1d4ed8; }
    .btn-wait { background: #7c3aed; color: white; }
    .btn-wait:hover { background: #6d28d9; }
    .btn-attend { background: #0d9488; color: white; }
    .btn-attend:hover { background: #0f766e; }
    .btn-close { background: #059669; color: white; }
    .btn-close:hover { background: #047857; }
    .btn-cancel { background: #ef4444; color: white; }
    .btn-cancel:hover { background: #dc2626; }
    .final-state-label {
      font-size: 0.8rem;
      color: #94a3b8;
      font-style: italic;
    }
    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #94a3b8;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
    }
    .modal-card {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      padding: 1.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #64748b;
      cursor: pointer;
    }
    .form-group {
      margin-bottom: 1.2rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.4rem;
    }
    .form-control {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      box-sizing: border-box;
    }
    .form-control:focus {
      outline: none;
      border-color: #0284c7;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.75rem;
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class AppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);

  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  searchRut = '';
  selectedStatus = '';
  alertMessage: string | null = null;
  alertType: 'success' | 'error' | 'info' = 'info';
  showModal = false;

  newAppointment: CreateAppointmentDto = {
    patientRut: '',
    serviceId: 101,
    boxId: 1,
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16)
  };

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        this.applyFilter();
        this.showAlert('Datos de atenciones actualizados correctamente', 'info');
      },
      error: (err) => {
        console.warn('Backend no disponible o error HTTP:', err);
        // Cargar datos demostrativos para pruebas inmediatas si backend aún no está iniciado
        if (this.appointments.length === 0) {
          this.loadMockData();
          this.showAlert('Mostrando datos demostrativos en memoria (BFF desconectado)', 'info');
        } else {
          this.showAlert('Error al conectar con la API: ' + (err.error?.message || err.message), 'error');
        }
      }
    });
  }

  private loadMockData() {
    const now = new Date();
    this.appointments = [
      { id: 1, patientRut: '12345678-9', serviceId: 101, boxId: 1, scheduledAt: new Date(now.getTime() + 7200000).toISOString(), status: 'SOLICITADA' },
      { id: 2, patientRut: '18765432-1', serviceId: 102, boxId: 2, scheduledAt: new Date(now.getTime() + 14400000).toISOString(), status: 'CONFIRMADA' },
      { id: 3, patientRut: '11223344-5', serviceId: 101, boxId: 1, scheduledAt: new Date(now.getTime() - 900000).toISOString(), status: 'EN_ESPERA' },
      { id: 4, patientRut: '19988776-K', serviceId: 103, boxId: 3, scheduledAt: new Date(now.getTime() - 1800000).toISOString(), status: 'EN_ATENCION' },
      { id: 5, patientRut: '15544332-8', serviceId: 102, boxId: 2, scheduledAt: new Date(now.getTime() - 7200000).toISOString(), status: 'CERRADA' },
      { id: 6, patientRut: '17654321-0', serviceId: 101, boxId: 1, scheduledAt: new Date(now.getTime() - 86400000).toISOString(), status: 'CANCELADA' }
    ];
    this.applyFilter();
  }

  applyFilter() {
    this.filteredAppointments = this.appointments.filter(app => {
      const matchesRut = !this.searchRut || app.patientRut.toLowerCase().includes(this.searchRut.toLowerCase());
      const matchesStatus = !this.selectedStatus || app.status === this.selectedStatus;
      return matchesRut && matchesStatus;
    });
  }

  countByStatus(status: AppointmentStatus): number {
    return this.appointments.filter(a => a.status === status).length;
  }

  changeStatus(appointment: Appointment, nextStatus: AppointmentStatus) {
    if (!appointment.id) return;

    this.appointmentService.transitionStatus(appointment.id, nextStatus).subscribe({
      next: (updated) => {
        appointment.status = updated.status;
        this.applyFilter();
        this.showAlert(`Atención #${appointment.id} transicionó a ${nextStatus}`, 'success');
      },
      error: (err) => {
        // Soporte para simular transición en local si backend está desconectado
        const canTransition = this.checkTransitionRule(appointment.status, nextStatus);
        if (canTransition) {
          appointment.status = nextStatus;
          this.applyFilter();
          this.showAlert(`Atención #${appointment.id} transicionó a ${nextStatus} (Local)`, 'success');
        } else {
          this.showAlert(`Error: Transición no permitida de ${appointment.status} a ${nextStatus}`, 'error');
        }
      }
    });
  }

  private checkTransitionRule(current: AppointmentStatus, next: AppointmentStatus): boolean {
    if (current === 'SOLICITADA' && (next === 'CONFIRMADA' || next === 'CANCELADA')) return true;
    if (current === 'CONFIRMADA' && (next === 'EN_ESPERA' || next === 'CANCELADA')) return true;
    if (current === 'EN_ESPERA' && next === 'EN_ATENCION') return true;
    if (current === 'EN_ATENCION' && next === 'CERRADA') return true;
    return false;
  }

  openCreateModal() {
    this.newAppointment = {
      patientRut: '',
      serviceId: 101,
      boxId: 1,
      scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16)
    };
    this.showModal = true;
  }

  submitCreate() {
    this.appointmentService.createAppointment(this.newAppointment).subscribe({
      next: (created) => {
        this.appointments.unshift(created);
        this.applyFilter();
        this.showModal = false;
        this.showAlert('Atención creada exitosamente con estado SOLICITADA', 'success');
      },
      error: () => {
        // Fallback local
        const newId = this.appointments.length + 1;
        const localItem: Appointment = {
          id: newId,
          ...this.newAppointment,
          status: 'SOLICITADA'
        };
        this.appointments.unshift(localItem);
        this.applyFilter();
        this.showModal = false;
        this.showAlert('Atención creada exitosamente con estado SOLICITADA (Local)', 'success');
      }
    });
  }

  private showAlert(message: string, type: 'success' | 'error' | 'info') {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => {
      if (this.alertMessage === message) {
        this.alertMessage = null;
      }
    }, 5000);
  }
}
