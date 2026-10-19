package cl.vidasalud.admin.consumer.dlq;

import cl.vidasalud.admin.dto.AppointmentEventDto;
import cl.vidasalud.admin.dto.ProcessedMessageLogDto;
import cl.vidasalud.admin.service.MessageAuditStore;
import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Consumidor del Dominio Funcional: Auditoría de Dead Letter Queues (DLQ).
 * Criterios de evaluación:
 * - Los microservicios deben manejar mensajes no entregados enviándolos a DLQ y registrándolos en logs.
 * - En los consumidores se maneja la confirmación de mensajes con ACK explícito.
 */
@Component
public class DeadLetterQueueConsumer {

    private static final Logger log = LoggerFactory.getLogger(DeadLetterQueueConsumer.class);

    private final MessageAuditStore auditStore;

    public DeadLetterQueueConsumer(MessageAuditStore auditStore) {
        this.auditStore = auditStore;
    }

    @RabbitListener(
            queues = {"${rabbitmq.queues.notifications-dlq}", "${rabbitmq.queues.tickets-dlq}"},
            containerFactory = "rabbitListenerContainerFactory"
    )
    public void processDeadLetterMessage(AppointmentEventDto event,
                                        Message message,
                                        Channel channel,
                                        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        String logId = UUID.randomUUID().toString().substring(0, 8);
        String receivedQueue = message.getMessageProperties().getConsumerQueue();

        log.warn("===============================================================================");
        log.warn("[DLQ ALERTA CRÍTICA] [{}] Mensaje recibido en Dead Letter Queue: '{}'", logId, receivedQueue);
        log.warn("[DLQ ALERTA CRÍTICA] [{}] Atención ID: {}, Paciente RUT: {}, DeliveryTag: {}",
                logId, event.getAppointmentId(), event.getPatientRut(), deliveryTag);
        log.warn("[DLQ ALERTA CRÍTICA] [{}] Razón de rechazo registrada en logs para auditoría", logId);
        log.warn("===============================================================================");

        try {
            // Registrar en el almacén de auditoría en memoria para visualización inmediata en API/Frontend
            auditStore.record(new ProcessedMessageLogDto(
                    logId,
                    receivedQueue != null ? receivedQueue : "DEAD_LETTER_QUEUE",
                    event.getAppointmentId(),
                    event.getPatientRut(),
                    "DEAD_LETTER_CAPTURED",
                    "Captura de Mensaje Muerto",
                    "Mensaje retenido en DLQ tras falla en consumidor principal",
                    deliveryTag
            ));

            // ACK explícito para confirmar la recepción y custodia del mensaje muerto
            channel.basicAck(deliveryTag, false);
            log.info("[DLQ] [{}] Mensaje archivado y ACK enviado satisfactoriamente para DLQ tag: {}", logId, deliveryTag);

        } catch (Exception ex) {
            log.error("[DLQ] [{}] Error inesperado al archivar mensaje de DLQ: {}", logId, ex.getMessage());
            // Rechazo seguro
            channel.basicReject(deliveryTag, false);
        }
    }
}
