export type AppointmentStatus =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'EN_ESPERA'
  | 'EN_ATENCION'
  | 'CERRADA'
  | 'CANCELADA';

export interface Appointment {
  id?: number;
  patientRut: string;
  serviceId: number;
  boxId: number;
  scheduledAt: string;
  status: AppointmentStatus;
}

export interface CreateAppointmentDto {
  patientRut: string;
  serviceId: number;
  boxId: number;
  scheduledAt: string;
}

export interface TransitionStatusDto {
  nextStatus: AppointmentStatus;
}
