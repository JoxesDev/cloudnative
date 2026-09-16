package cl.vidasalud.bff.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class BffAppointmentsController {

    private final RestClient restClient;
    private final String appointmentsUrl;

    public BffAppointmentsController(@Value("${appointments.url:http://localhost:8081}") String appointmentsUrl) {
        this.appointmentsUrl = appointmentsUrl;
        this.restClient = RestClient.builder().baseUrl(appointmentsUrl).build();
    }

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String patientRut,
            @RequestParam(required = false) String status) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/appointments")
                            .queryParamIfPresent("patientRut", java.util.Optional.ofNullable(patientRut))
                            .queryParamIfPresent("status", java.util.Optional.ofNullable(status))
                            .build())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .toEntity(String.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error al comunicarse con ms-vidasalud-appointments: " + ex.getMessage() + "\"}");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return restClient.get()
                    .uri("/api/appointments/{id}", id)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .toEntity(String.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error al comunicarse con ms-vidasalud-appointments: " + ex.getMessage() + "\"}");
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody String body) {
        try {
            return restClient.post()
                    .uri("/api/appointments")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toEntity(String.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error al comunicarse con ms-vidasalud-appointments: " + ex.getMessage() + "\"}");
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> transitionStatus(@PathVariable Long id, @RequestBody String body) {
        try {
            return restClient.patch()
                    .uri("/api/appointments/{id}/status", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toEntity(String.class);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error al comunicarse con ms-vidasalud-appointments: " + ex.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            return restClient.delete()
                    .uri("/api/appointments/{id}", id)
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getResponseBodyAsString());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body("{\"error\": \"Error al comunicarse con ms-vidasalud-appointments: " + ex.getMessage() + "\"}");
        }
    }
}
