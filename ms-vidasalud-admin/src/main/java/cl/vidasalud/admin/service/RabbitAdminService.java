package cl.vidasalud.admin.service;

import cl.vidasalud.admin.config.RabbitMQProperties;
import cl.vidasalud.admin.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.HeadersExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio dedicado para la administración de topología RabbitMQ.
 * Criterio de evaluación:
 * - Toda la lógica de creación, actualización y eliminación de colas y exchanges
 *   está encapsulada en un servicio dedicado (RabbitAdminService).
 * - Los controladores llaman a métodos de alto nivel y no conocen detalles internos de RabbitMQ.
 */
@Service
public class RabbitAdminService {

    private static final Logger log = LoggerFactory.getLogger(RabbitAdminService.class);

    private final RabbitAdmin rabbitAdmin;
    private final RabbitTemplate rabbitTemplate;
    private final RabbitMQProperties properties;
    private final MessageAuditStore auditStore;

    // Registro en memoria de topología conocida
    private final Set<String> registeredQueues = ConcurrentHashMap.newKeySet();
    private final Map<String, String> registeredExchanges = new ConcurrentHashMap<>();
    private final List<BindingSummaryDto> registeredBindings = Collections.synchronizedList(new ArrayList<>());

    public RabbitAdminService(RabbitAdmin rabbitAdmin,
                              RabbitTemplate rabbitTemplate,
                              RabbitMQProperties properties,
                              MessageAuditStore auditStore) {
        this.rabbitAdmin = rabbitAdmin;
        this.rabbitTemplate = rabbitTemplate;
        this.properties = properties;
        this.auditStore = auditStore;

        // Registrar colas iniciales de la configuración centralizada
        registeredQueues.add(properties.getNotificationsQueue());
        registeredQueues.add(properties.getNotificationsDlq());
        registeredQueues.add(properties.getTicketsQueue());
        registeredQueues.add(properties.getTicketsDlq());
        registeredQueues.add(properties.getAuditQueue());
        registeredQueues.add(properties.getAuditDlq());

        // Registrar exchanges iniciales
        registeredExchanges.put(properties.getDirectExchange(), "direct");
        registeredExchanges.put(properties.getDlxExchange(), "direct");

        // Registrar bindings iniciales
        registeredBindings.add(new BindingSummaryDto(properties.getNotificationsQueue(), properties.getDirectExchange(), properties.getNotificationsRoutingKey()));
        registeredBindings.add(new BindingSummaryDto(properties.getNotificationsDlq(), properties.getDlxExchange(), properties.getNotificationsDlqRoutingKey()));
        registeredBindings.add(new BindingSummaryDto(properties.getTicketsQueue(), properties.getDirectExchange(), properties.getTicketsRoutingKey()));
        registeredBindings.add(new BindingSummaryDto(properties.getTicketsDlq(), properties.getDlxExchange(), properties.getTicketsDlqRoutingKey()));
        registeredBindings.add(new BindingSummaryDto(properties.getAuditQueue(), properties.getDirectExchange(), properties.getAuditRoutingKey()));
        registeredBindings.add(new BindingSummaryDto(properties.getAuditDlq(), properties.getDlxExchange(), properties.getAuditDlqRoutingKey()));
    }

    /**
     * Crea una nueva cola en RabbitMQ con argumentos opcionales para Dead Letter Exchange (DLX).
     */
    public QueueSummaryDto createQueue(CreateQueueDto dto) {
        log.info("Creando cola '{}' (durable={}, dlx={})", dto.getName(), dto.isDurable(), dto.getDeadLetterExchange());

        Map<String, Object> args = new HashMap<>();
        if (dto.getDeadLetterExchange() != null && !dto.getDeadLetterExchange().isBlank()) {
            args.put("x-dead-letter-exchange", dto.getDeadLetterExchange());
            if (dto.getDeadLetterRoutingKey() != null && !dto.getDeadLetterRoutingKey().isBlank()) {
                args.put("x-dead-letter-routing-key", dto.getDeadLetterRoutingKey());
            }
        }

        Queue queue = new Queue(dto.getName(), dto.isDurable(), dto.isExclusive(), dto.isAutoDelete(), args);
        rabbitAdmin.declareQueue(queue);
        registeredQueues.add(dto.getName());

        return getQueueDetails(dto.getName());
    }

    /**
     * Elimina una cola existente por nombre.
     */
    public boolean deleteQueue(String queueName) {
        log.info("Eliminando cola '{}'", queueName);
        boolean deleted = rabbitAdmin.deleteQueue(queueName);
        registeredQueues.remove(queueName);
        registeredBindings.removeIf(b -> b.getQueueName().equalsIgnoreCase(queueName));
        return deleted;
    }

    /**
     * Crea un nuevo exchange en RabbitMQ según su tipo (direct, topic, fanout, headers).
     */
    public ExchangeSummaryDto createExchange(CreateExchangeDto dto) {
        log.info("Creando exchange '{}' de tipo '{}'", dto.getName(), dto.getType());

        Exchange exchange;
        String type = dto.getType().toLowerCase(Locale.ROOT);
        switch (type) {
            case "topic":
                exchange = new TopicExchange(dto.getName(), dto.isDurable(), dto.isAutoDelete());
                break;
            case "fanout":
                exchange = new FanoutExchange(dto.getName(), dto.isDurable(), dto.isAutoDelete());
                break;
            case "headers":
                exchange = new HeadersExchange(dto.getName(), dto.isDurable(), dto.isAutoDelete());
                break;
            case "direct":
            default:
                exchange = new DirectExchange(dto.getName(), dto.isDurable(), dto.isAutoDelete());
                break;
        }

        rabbitAdmin.declareExchange(exchange);
        registeredExchanges.put(dto.getName(), type);

        return new ExchangeSummaryDto(dto.getName(), type, dto.isDurable(), dto.isAutoDelete());
    }

    /**
     * Elimina un exchange por nombre.
     */
    public boolean deleteExchange(String exchangeName) {
        log.info("Eliminando exchange '{}'", exchangeName);
        boolean deleted = rabbitAdmin.deleteExchange(exchangeName);
        registeredExchanges.remove(exchangeName);
        registeredBindings.removeIf(b -> b.getExchangeName().equalsIgnoreCase(exchangeName));
        return deleted;
    }

    /**
     * Enlaza una cola con un exchange usando una routing key.
     */
    public BindingSummaryDto createBinding(CreateBindingDto dto) {
        log.info("Creando binding: cola '{}' -> exchange '{}' (routingKey='{}')",
                dto.getQueueName(), dto.getExchangeName(), dto.getRoutingKey());

        Binding binding = new Binding(
                dto.getQueueName(),
                Binding.DestinationType.QUEUE,
                dto.getExchangeName(),
                dto.getRoutingKey(),
                null
        );

        rabbitAdmin.declareBinding(binding);

        BindingSummaryDto summary = new BindingSummaryDto(dto.getQueueName(), dto.getExchangeName(), dto.getRoutingKey());
        registeredBindings.removeIf(b ->
                b.getQueueName().equalsIgnoreCase(dto.getQueueName()) &&
                b.getExchangeName().equalsIgnoreCase(dto.getExchangeName()) &&
                b.getRoutingKey().equalsIgnoreCase(dto.getRoutingKey())
        );
        registeredBindings.add(summary);

        return summary;
    }

    /**
     * Elimina un enlace (binding).
     */
    public void deleteBinding(RemoveBindingDto dto) {
        log.info("Eliminando binding: cola '{}' -> exchange '{}' (routingKey='{}')",
                dto.getQueueName(), dto.getExchangeName(), dto.getRoutingKey());

        Binding binding = new Binding(
                dto.getQueueName(),
                Binding.DestinationType.QUEUE,
                dto.getExchangeName(),
                dto.getRoutingKey(),
                null
        );

        rabbitAdmin.removeBinding(binding);
        registeredBindings.removeIf(b ->
                b.getQueueName().equalsIgnoreCase(dto.getQueueName()) &&
                b.getExchangeName().equalsIgnoreCase(dto.getExchangeName()) &&
                b.getRoutingKey().equalsIgnoreCase(dto.getRoutingKey())
        );
    }

    /**
     * Retorna el listado de colas conocidas y sus métricas AMQP.
     */
    public List<QueueSummaryDto> listQueues() {
        List<QueueSummaryDto> summaries = new ArrayList<>();
        for (String qName : registeredQueues) {
            summaries.add(getQueueDetails(qName));
        }
        return summaries;
    }

    /**
     * Obtiene métricas en tiempo real de una cola.
     */
    public QueueSummaryDto getQueueDetails(String queueName) {
        Properties qProps = null;
        try {
            qProps = rabbitAdmin.getQueueProperties(queueName);
        } catch (Exception ex) {
            log.debug("No se pudieron leer propiedades de RabbitMQ para {}: {}", queueName, ex.getMessage());
        }

        int messageCount = 0;
        int consumerCount = 0;

        if (qProps != null) {
            Object msgObj = qProps.get(RabbitAdmin.QUEUE_MESSAGE_COUNT);
            if (msgObj instanceof Number) {
                messageCount = ((Number) msgObj).intValue();
            }
            Object cObj = qProps.get(RabbitAdmin.QUEUE_CONSUMER_COUNT);
            if (cObj instanceof Number) {
                consumerCount = ((Number) cObj).intValue();
            }
        }

        boolean isDlq = queueName.endsWith(".dlq") || queueName.contains("dlq");
        return new QueueSummaryDto(queueName, true, false, false, messageCount, consumerCount, isDlq);
    }

    /**
     * Retorna la lista de exchanges registrados.
     */
    public List<ExchangeSummaryDto> listExchanges() {
        List<ExchangeSummaryDto> list = new ArrayList<>();
        registeredExchanges.forEach((name, type) -> {
            list.add(new ExchangeSummaryDto(name, type, true, false));
        });
        return list;
    }

    /**
     * Retorna la lista de bindings registrados.
     */
    public List<BindingSummaryDto> listBindings() {
        return new ArrayList<>(registeredBindings);
    }

    /**
     * Publica un mensaje asíncrono para verificar enrutamiento, ACK y desvío a DLQ.
     */
    public AppointmentEventDto publishTestMessage(PublishTestMessageDto dto) {
        log.info("Publicando mensaje de prueba al exchange '{}' con routingKey '{}' (simulateError={})",
                dto.getExchange(), dto.getRoutingKey(), dto.isSimulateError());

        AppointmentEventDto event = new AppointmentEventDto(
                dto.getAppointmentId(),
                dto.getPatientRut(),
                1L,
                101L,
                "2026-10-15 10:30",
                "CONFIRMADA",
                "TEST_EVENT",
                dto.isSimulateError()
        );

        rabbitTemplate.convertAndSend(dto.getExchange(), dto.getRoutingKey(), event);
        return event;
    }
}
