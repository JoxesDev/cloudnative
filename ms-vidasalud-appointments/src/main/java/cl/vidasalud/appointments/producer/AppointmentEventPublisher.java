package cl.vidasalud.appointments.producer;

import cl.vidasalud.appointments.domain.Appointment;

/**
 * Interfaz para publicación de eventos de dominio desacoplada de la implementación tecnológica.
 */
public interface AppointmentEventPublisher {

    void publishAppointmentCreated(Appointment appointment);

    void publishAppointmentStatusChanged(Appointment appointment);
}
