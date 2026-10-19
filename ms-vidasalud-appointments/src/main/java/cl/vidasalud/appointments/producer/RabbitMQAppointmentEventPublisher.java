package cl.vidasalud.appointments.producer;

import cl.vidasalud.appointments.config.RabbitMQProperties;
import cl.vidasalud.appointments.domain.Appointment;
import cl.vidasalud.appointments.event.AppointmentEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Productor AMQP de eventos de atención médica.
 * Publica eventos a colas de notificaciones, tickets y auditoría.
 */
@Component
public class RabbitMQAppointmentEventPublisher implements AppointmentEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(RabbitMQAppointmentEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMQProperties properties;

    public RabbitMQAppointmentEventPublisher(RabbitTemplate rabbitTemplate, RabbitMQProperties properties) {
        this.rabbitTemplate = rabbitTemplate;
        this.properties = properties;
    }

    @Override
    public void publishAppointmentCreated(Appointment appointment) {
        AppointmentEvent event = new AppointmentEvent(
                appointment.getId(),
                appointment.getPatientRut(),
                appointment.getServiceId(),
                appointment.getBoxId(),
                appointment.getScheduledAt() != null ? appointment.getScheduledAt().toString() : null,
                appointment.getStatus().name(),
                "APPOINTMENT_CREATED"
        );

        sendEvent(properties.getNotificationsRoutingKey(), event, "Notificación de Creación");
        sendEvent(properties.getTicketsRoutingKey(), event, "Generación de Ticket Inicial");
        sendEvent(properties.getAuditRoutingKey(), event, "Registro de Auditoría");
    }

    @Override
    public void publishAppointmentStatusChanged(Appointment appointment) {
        AppointmentEvent event = new AppointmentEvent(
                appointment.getId(),
                appointment.getPatientRut(),
                appointment.getServiceId(),
                appointment.getBoxId(),
                appointment.getScheduledAt() != null ? appointment.getScheduledAt().toString() : null,
                appointment.getStatus().name(),
                "APPOINTMENT_STATUS_CHANGED"
        );

        sendEvent(properties.getNotificationsRoutingKey(), event, "Notificación de Cambio de Estado");
        sendEvent(properties.getAuditRoutingKey(), event, "Auditoría de Cambio de Estado");
    }

    private void sendEvent(String routingKey, AppointmentEvent event, String description) {
        try {
            log.info("[PRODUCTOR] Publicando evento '{}' (Atención ID: {}, RUT: {}) a exchange '{}' con routingKey '{}'",
                    description, event.getAppointmentId(), event.getPatientRut(), properties.getDirectExchange(), routingKey);
            rabbitTemplate.convertAndSend(properties.getDirectExchange(), routingKey, event);
            log.info("[PRODUCTOR] Evento '{}' emitido exitosamente a RabbitMQ", description);
        } catch (Exception ex) {
            log.warn("[PRODUCTOR] No fue posible publicar evento '{}' en RabbitMQ: {}. El sistema continúa operando normalmente.",
                    description, ex.getMessage());
        }
    }
}
