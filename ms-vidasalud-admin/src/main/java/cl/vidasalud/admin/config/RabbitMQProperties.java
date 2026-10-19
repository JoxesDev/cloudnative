package cl.vidasalud.admin.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * Propiedades centralizadas de topología RabbitMQ.
 * Criterio de evaluación: Define en application.yml o clase @Configuration
 * los nombres de colas, exchanges y bindings de forma centralizada sin valores sueltos.
 */
@ConfigurationProperties(prefix = "rabbitmq")
public class RabbitMQProperties {

    private Map<String, String> exchanges = new HashMap<>();
    private Map<String, String> queues = new HashMap<>();
    private Map<String, String> routingKeys = new HashMap<>();

    public Map<String, String> getExchanges() {
        return exchanges;
    }

    public void setExchanges(Map<String, String> exchanges) {
        this.exchanges = exchanges;
    }

    public Map<String, String> getQueues() {
        return queues;
    }

    public void setQueues(Map<String, String> queues) {
        this.queues = queues;
    }

    public Map<String, String> getRoutingKeys() {
        return routingKeys;
    }

    public void setRoutingKeys(Map<String, String> routingKeys) {
        this.routingKeys = routingKeys;
    }

    // Métodos utilitarios de acceso directo
    public String getDirectExchange() {
        return exchanges.getOrDefault("direct", "vidasalud.direct.exchange");
    }

    public String getDlxExchange() {
        return exchanges.getOrDefault("dlx", "vidasalud.dlx.exchange");
    }

    public String getNotificationsQueue() {
        return queues.getOrDefault("notifications", "vidasalud.notifications.queue");
    }

    public String getNotificationsDlq() {
        return queues.getOrDefault("notifications-dlq", "vidasalud.notifications.dlq");
    }

    public String getTicketsQueue() {
        return queues.getOrDefault("tickets", "vidasalud.tickets.queue");
    }

    public String getTicketsDlq() {
        return queues.getOrDefault("tickets-dlq", "vidasalud.tickets.dlq");
    }

    public String getAuditQueue() {
        return queues.getOrDefault("audit", "vidasalud.audit.queue");
    }

    public String getAuditDlq() {
        return queues.getOrDefault("audit-dlq", "vidasalud.audit.dlq");
    }

    public String getNotificationsRoutingKey() {
        return routingKeys.getOrDefault("notifications", "appointment.notification");
    }

    public String getNotificationsDlqRoutingKey() {
        return routingKeys.getOrDefault("notifications-dlq", "appointment.notification.dlq");
    }

    public String getTicketsRoutingKey() {
        return routingKeys.getOrDefault("tickets", "appointment.ticket");
    }

    public String getTicketsDlqRoutingKey() {
        return routingKeys.getOrDefault("tickets-dlq", "appointment.ticket.dlq");
    }

    public String getAuditRoutingKey() {
        return routingKeys.getOrDefault("audit", "appointment.audit");
    }

    public String getAuditDlqRoutingKey() {
        return routingKeys.getOrDefault("audit-dlq", "appointment.audit.dlq");
    }
}
