package cl.vidasalud.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

/**
 * BFF Controller que expone y protege los endpoints de administración de RabbitMQ.
 * Solo usuarios autenticados con rol Admin en Microsoft Entra ID pueden acceder.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class BffAdminController {

    private final RestClient restClient;

    public BffAdminController(@Value("${admin.url:http://localhost:8083}") String adminUrl) {
        this.restClient = RestClient.builder().baseUrl(adminUrl).build();
    }

    @GetMapping("/queues")
    public ResponseEntity<?> listQueues() {
        return proxyGet("/api/admin/queues");
    }

    @PostMapping("/queues")
    public ResponseEntity<?> createQueue(@RequestBody String body) {
        return proxyPost("/api/admin/queues", body);
    }

    @DeleteMapping("/queues/{name}")
    public ResponseEntity<?> deleteQueue(@PathVariable String name) {
        return proxyDelete("/api/admin/queues/" + name);
    }

    @GetMapping("/exchanges")
    public ResponseEntity<?> listExchanges() {
        return proxyGet("/api/admin/exchanges");
    }

    @PostMapping("/exchanges")
    public ResponseEntity<?> createExchange(@RequestBody String body) {
        return proxyPost("/api/admin/exchanges", body);
    }

    @DeleteMapping("/exchanges/{name}")
    public ResponseEntity<?> deleteExchange(@PathVariable String name) {
        return proxyDelete("/api/admin/exchanges/" + name);
    }

    @GetMapping("/bindings")
    public ResponseEntity<?> listBindings() {
        return proxyGet("/api/admin/bindings");
    }

    @PostMapping("/bindings")
    public ResponseEntity<?> createBinding(@RequestBody String body) {
        return proxyPost("/api/admin/bindings", body);
    }

    @DeleteMapping("/bindings")
    public ResponseEntity<?> deleteBinding(@RequestBody String body) {
        try {
            return restClient.method(org.springframework.http.HttpMethod.DELETE)
                    .uri("/api/admin/bindings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toEntity(String.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error de comunicación con ms-vidasalud-admin: " + ex.getMessage() + "\"}");
        }
    }

    @PostMapping("/messages/publish")
    public ResponseEntity<?> publishTestMessage(@RequestBody String body) {
        return proxyPost("/api/admin/messages/publish", body);
    }

    @GetMapping("/logs")
    public ResponseEntity<?> getLogs() {
        return proxyGet("/api/admin/logs");
    }

    @DeleteMapping("/logs")
    public ResponseEntity<?> clearLogs() {
        return proxyDelete("/api/admin/logs");
    }

    private ResponseEntity<?> proxyGet(String uri) {
        try {
            return restClient.get()
                    .uri(uri)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .toEntity(String.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error al comunicarse con ms-vidasalud-admin: " + ex.getMessage() + "\"}");
        }
    }

    private ResponseEntity<?> proxyPost(String uri, String body) {
        try {
            return restClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toEntity(String.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error al comunicarse con ms-vidasalud-admin: " + ex.getMessage() + "\"}");
        }
    }

    private ResponseEntity<?> proxyDelete(String uri) {
        try {
            return restClient.delete()
                    .uri(uri)
                    .retrieve()
                    .toEntity(String.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error al comunicarse con ms-vidasalud-admin: " + ex.getMessage() + "\"}");
        }
    }
}
