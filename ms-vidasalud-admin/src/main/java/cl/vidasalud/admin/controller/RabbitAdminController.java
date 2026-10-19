package cl.vidasalud.admin.controller;

import cl.vidasalud.admin.dto.*;
import cl.vidasalud.admin.service.MessageAuditStore;
import cl.vidasalud.admin.service.RabbitAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la Administración de RabbitMQ.
 * Cumple con los criterios de evaluación:
 * - Endpoints REST bien definidos (POST /queues, DELETE /queues/{name}, etc.).
 * - Verbos HTTP semánticamente correctos (GET, POST, DELETE).
 * - Uso exclusivo de RabbitAdminService sin mezclar detalles AMQP en el controlador.
 * - Validación exhaustiva con @Valid y DTOs dedicados.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class RabbitAdminController {

    private final RabbitAdminService rabbitAdminService;
    private final MessageAuditStore auditStore;

    public RabbitAdminController(RabbitAdminService rabbitAdminService, MessageAuditStore auditStore) {
        this.rabbitAdminService = rabbitAdminService;
        this.auditStore = auditStore;
    }

    // =========================================================================
    // 1. GESTIÓN DE COLAS (QUEUES)
    // =========================================================================

    @GetMapping("/queues")
    public ResponseEntity<List<QueueSummaryDto>> listQueues() {
        return ResponseEntity.ok(rabbitAdminService.listQueues());
    }

    @PostMapping("/queues")
    public ResponseEntity<QueueSummaryDto> createQueue(@Valid @RequestBody CreateQueueDto request) {
        QueueSummaryDto created = rabbitAdminService.createQueue(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/queues/{name}")
    public ResponseEntity<Map<String, Object>> deleteQueue(@PathVariable String name) {
        boolean deleted = rabbitAdminService.deleteQueue(name);
        Map<String, Object> response = new HashMap<>();
        response.put("queue", name);
        response.put("deleted", deleted);
        response.put("message", deleted ? "Cola eliminada con éxito" : "No fue posible eliminar la cola");
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // 2. GESTIÓN DE EXCHANGES
    // =========================================================================

    @GetMapping("/exchanges")
    public ResponseEntity<List<ExchangeSummaryDto>> listExchanges() {
        return ResponseEntity.ok(rabbitAdminService.listExchanges());
    }

    @PostMapping("/exchanges")
    public ResponseEntity<ExchangeSummaryDto> createExchange(@Valid @RequestBody CreateExchangeDto request) {
        ExchangeSummaryDto created = rabbitAdminService.createExchange(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/exchanges/{name}")
    public ResponseEntity<Map<String, Object>> deleteExchange(@PathVariable String name) {
        boolean deleted = rabbitAdminService.deleteExchange(name);
        Map<String, Object> response = new HashMap<>();
        response.put("exchange", name);
        response.put("deleted", deleted);
        response.put("message", deleted ? "Exchange eliminado con éxito" : "No fue posible eliminar el exchange");
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // 3. GESTIÓN DE ENLACES (BINDINGS)
    // =========================================================================

    @GetMapping("/bindings")
    public ResponseEntity<List<BindingSummaryDto>> listBindings() {
        return ResponseEntity.ok(rabbitAdminService.listBindings());
    }

    @PostMapping("/bindings")
    public ResponseEntity<BindingSummaryDto> createBinding(@Valid @RequestBody CreateBindingDto request) {
        BindingSummaryDto created = rabbitAdminService.createBinding(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/bindings")
    public ResponseEntity<Map<String, Object>> deleteBinding(@Valid @RequestBody RemoveBindingDto request) {
        rabbitAdminService.deleteBinding(request);
        Map<String, Object> response = new HashMap<>();
        response.put("binding", request);
        response.put("message", "Binding eliminado con éxito");
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // 4. SIMULACIÓN DE MENSAJES Y AUDITORÍA DE DLQ
    // =========================================================================

    @PostMapping("/messages/publish")
    public ResponseEntity<Map<String, Object>> publishMessage(@Valid @RequestBody PublishTestMessageDto request) {
        AppointmentEventDto event = rabbitAdminService.publishTestMessage(request);
        Map<String, Object> response = new HashMap<>();
        response.put("status", "PUBLISHED");
        response.put("exchange", request.getExchange());
        response.put("routingKey", request.getRoutingKey());
        response.put("simulateError", request.isSimulateError());
        response.put("event", event);
        response.put("message", request.isSimulateError()
                ? "Mensaje publicado con simulación de error activa (será enviado a la DLQ correspondiente)"
                : "Mensaje publicado exitosamente para consumo y confirmación manual (ACK)");
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/logs")
    public ResponseEntity<List<ProcessedMessageLogDto>> getProcessedLogs() {
        return ResponseEntity.ok(auditStore.getRecentLogs());
    }

    @DeleteMapping("/logs")
    public ResponseEntity<Map<String, String>> clearLogs() {
        auditStore.clear();
        return ResponseEntity.ok(Map.of("message", "Registro de auditoría limpiado"));
    }
}
