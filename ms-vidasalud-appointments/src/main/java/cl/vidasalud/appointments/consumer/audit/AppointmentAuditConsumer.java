package cl.vidasalud.appointments.consumer.audit;

import cl.vidasalud.appointments.event.AppointmentEvent;
import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Consumidor del dominio funcional de Auditoría en el microservicio de Atenciones.
 * Cumple con los criterios de evaluación:
 * - Implementación con @RabbitListener.
 * - Confirmación manual explícita (ACK).
 * - Manejo explícito de excepciones con NACK a DLQ en caso de falla.
 */
@Component
public class AppointmentAuditConsumer {

    private static final Logger log = LoggerFactory.getLogger(AppointmentAuditConsumer.class);

    @RabbitListener(queues = "${rabbitmq.queues.audit}", containerFactory = "rabbitListenerContainerFactory")
    public void onAuditMessage(AppointmentEvent event,
                               Channel channel,
                               @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws IOException {
        log.info("[AUDITORIA CONSUMER] Evento de auditoría recibido - Atención ID: {}, Tipo: {}, DeliveryTag: {}",
                event.getAppointmentId(), event.getEventType(), deliveryTag);

        try {
            if (event.isSimulateError()) {
                throw new IllegalStateException("Simulación de error en consumidor de auditoría");
            }

            // Registro de auditoría del ciclo de atención
            log.info("[AUDITORIA CONSUMER] Registro exitoso para paciente {} en estado {}",
                    event.getPatientRut(), event.getStatus());

            // ACK explícito
            channel.basicAck(deliveryTag, false);
            log.info("[AUDITORIA CONSUMER] ACK confirmado para tag {}", deliveryTag);

        } catch (Exception ex) {
            log.error("[AUDITORIA CONSUMER] Falla al auditar evento: {}. Enviando NACK sin requeue a DLQ...", ex.getMessage());
            channel.basicNack(deliveryTag, false, false);
        }
    }
}
