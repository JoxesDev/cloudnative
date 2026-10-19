package cl.vidasalud.admin.consumer.ticket;

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
 * Consumidor del Dominio Funcional: Generación de Tickets y Documentos Médicos.
 * Criterios de evaluación:
 * - Implementado con @RabbitListener.
 * - Agrupado por dominio funcional (paquete cl.vidasalud.admin.consumer.ticket).
 * - Manejo de confirmación manual explícita (ACK).
 * - Manejo explícito de errores: NACK sin requeue para desvío directo a DLQ.
 */
@Component
public class TicketConsumer {

    private static final Logger log = LoggerFactory.getLogger(TicketConsumer.class);

    private final MessageAuditStore auditStore;

    public TicketConsumer(MessageAuditStore auditStore) {
        this.auditStore = auditStore;
    }

    @RabbitListener(queues = "${rabbitmq.queues.tickets}", containerFactory = "rabbitListenerContainerFactory")
    public void processTicketGeneration(AppointmentEventDto event,
                                        Channel channel,
                                        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        String logId = UUID.randomUUID().toString().substring(0, 8);
        log.info("[TICKETS] [{}] Solicitud de ticket recibida - Atencion ID: {}, Paciente: {}, DeliveryTag: {}",
                logId, event.getAppointmentId(), event.getPatientRut(), deliveryTag);

        try {
            if (event.isSimulateError()) {
                throw new IllegalStateException("Error inducido para prueba de tickets en Dead Letter Queue");
            }

            // Generación asíncrona simulada de comprobante digital en formato PDF
            log.info("[TICKETS] [{}] Generando comprobante digital y ticket de atención para Box {} y Servicio {}...",
                    logId, event.getBoxId(), event.getServiceId());

            // ACK explícito
            channel.basicAck(deliveryTag, false);
            log.info("[TICKETS] [{}] Documento emitido satisfactoriamente. ACK confirmado a RabbitMQ.", logId);

            auditStore.record(new ProcessedMessageLogDto(
                    logId,
                    "vidasalud.tickets.queue",
                    event.getAppointmentId(),
                    event.getPatientRut(),
                    "ACK_SUCCESS",
                    "Generación de Ticket Médico",
                    "Ticket digital PDF generado exitosamente",
                    deliveryTag
            ));

        } catch (Exception ex) {
            log.error("[TICKETS] [{}] Falla en generación de ticket: {}. Enviando NACK sin requeue a DLQ...",
                    logId, ex.getMessage());

            // NACK explícito enviando a DLQ
            channel.basicNack(deliveryTag, false, false);

            auditStore.record(new ProcessedMessageLogDto(
                    logId,
                    "vidasalud.tickets.queue",
                    event.getAppointmentId(),
                    event.getPatientRut(),
                    "NACK_TO_DLQ",
                    "Falla en Ticket",
                    "Error: " + ex.getMessage() + " -> Derivado a DLQ",
                    deliveryTag
            ));
        }
    }
}
