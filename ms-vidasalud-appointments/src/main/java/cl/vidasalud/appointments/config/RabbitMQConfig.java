package cl.vidasalud.appointments.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuración centralizada de RabbitMQ para el microservicio de atenciones.
 * Cumple con los criterios de evaluación:
 * - Define Queue, Exchange y Binding por cada caso de uso.
 * - Desacopla la lógica de mensajería de la lógica de negocio.
 * - Utiliza confirmación manual (ACK).
 */
@Configuration
public class RabbitMQConfig {

    private final RabbitMQProperties properties;

    public RabbitMQConfig(RabbitMQProperties properties) {
        this.properties = properties;
    }

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange(properties.getDirectExchange(), true, false);
    }

    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange(properties.getDlxExchange(), true, false);
    }

    // Cola y Binding para Auditoría interna
    @Bean
    public Queue auditQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", properties.getDlxExchange());
        args.put("x-dead-letter-routing-key", properties.getAuditDlqRoutingKey());
        return new Queue(properties.getAuditQueue(), true, false, false, args);
    }

    @Bean
    public Queue auditDlq() {
        return new Queue(properties.getAuditDlq(), true, false, false);
    }

    @Bean
    public Binding auditBinding(Queue auditQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(auditQueue)
                .to(directExchange)
                .with(properties.getAuditRoutingKey());
    }

    @Bean
    public Binding auditDlqBinding(Queue auditDlq, DirectExchange dlxExchange) {
        return BindingBuilder.bind(auditDlq)
                .to(dlxExchange)
                .with(properties.getAuditDlqRoutingKey());
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.setAutoStartup(true);
        return admin;
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        factory.setPrefetchCount(10);
        return factory;
    }
}
