package cl.vidasalud.admin;

import cl.vidasalud.admin.config.RabbitMQProperties;
import cl.vidasalud.admin.dto.*;
import cl.vidasalud.admin.service.MessageAuditStore;
import cl.vidasalud.admin.service.RabbitAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.Exchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RabbitAdminServiceTest {

    @Mock
    private RabbitAdmin rabbitAdmin;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private RabbitMQProperties properties;
    private MessageAuditStore auditStore;
    private RabbitAdminService service;

    @BeforeEach
    void setUp() {
        properties = new RabbitMQProperties();
        auditStore = new MessageAuditStore();
        service = new RabbitAdminService(rabbitAdmin, rabbitTemplate, properties, auditStore);
    }

    @Test
    void testCreateQueueSuccess() {
        CreateQueueDto dto = new CreateQueueDto("test.custom.queue", true, false, false);
        dto.setDeadLetterExchange("vidasalud.dlx.exchange");
        dto.setDeadLetterRoutingKey("test.custom.dlq");

        QueueSummaryDto result = service.createQueue(dto);

        assertNotNull(result);
        assertEquals("test.custom.queue", result.getName());
        verify(rabbitAdmin, times(1)).declareQueue(any(Queue.class));
    }

    @Test
    void testDeleteQueueSuccess() {
        when(rabbitAdmin.deleteQueue("test.custom.queue")).thenReturn(true);

        boolean deleted = service.deleteQueue("test.custom.queue");

        assertTrue(deleted);
        verify(rabbitAdmin, times(1)).deleteQueue("test.custom.queue");
    }

    @Test
    void testCreateExchangeDirect() {
        CreateExchangeDto dto = new CreateExchangeDto("custom.direct", "direct", true, false);

        ExchangeSummaryDto result = service.createExchange(dto);

        assertNotNull(result);
        assertEquals("custom.direct", result.getName());
        assertEquals("direct", result.getType());
        verify(rabbitAdmin, times(1)).declareExchange(any(Exchange.class));
    }

    @Test
    void testCreateExchangeTopic() {
        CreateExchangeDto dto = new CreateExchangeDto("custom.topic", "topic", true, false);

        ExchangeSummaryDto result = service.createExchange(dto);

        assertNotNull(result);
        assertEquals("custom.topic", result.getName());
        assertEquals("topic", result.getType());
        verify(rabbitAdmin, times(1)).declareExchange(any(Exchange.class));
    }

    @Test
    void testCreateBinding() {
        CreateBindingDto dto = new CreateBindingDto("test.queue", "test.exchange", "test.rk");

        BindingSummaryDto result = service.createBinding(dto);

        assertNotNull(result);
        assertEquals("test.queue", result.getQueueName());
        assertEquals("test.exchange", result.getExchangeName());
        assertEquals("test.rk", result.getRoutingKey());
        verify(rabbitAdmin, times(1)).declareBinding(any(Binding.class));
    }

    @Test
    void testDeleteBinding() {
        RemoveBindingDto dto = new RemoveBindingDto("test.queue", "test.exchange", "test.rk");

        service.deleteBinding(dto);

        verify(rabbitAdmin, times(1)).removeBinding(any(Binding.class));
    }

    @Test
    void testListQueuesContainsInitialQueues() {
        List<QueueSummaryDto> queues = service.listQueues();
        assertFalse(queues.isEmpty());
        assertTrue(queues.stream().anyMatch(q -> q.getName().equals(properties.getNotificationsQueue())));
        assertTrue(queues.stream().anyMatch(q -> q.getName().equals(properties.getNotificationsDlq())));
    }

    @Test
    void testPublishTestMessage() {
        PublishTestMessageDto dto = new PublishTestMessageDto("test.exchange", "test.rk", "hola", false);

        AppointmentEventDto event = service.publishTestMessage(dto);

        assertNotNull(event);
        assertEquals(101L, event.getAppointmentId());
        verify(rabbitTemplate, times(1)).convertAndSend(eq("test.exchange"), eq("test.rk"), any(AppointmentEventDto.class));
    }
}
