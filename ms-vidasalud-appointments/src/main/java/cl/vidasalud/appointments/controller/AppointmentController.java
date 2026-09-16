package cl.vidasalud.appointments.controller;

import cl.vidasalud.appointments.domain.Appointment;
import cl.vidasalud.appointments.domain.AppointmentStatus;
import cl.vidasalud.appointments.dto.CreateAppointmentRequest;
import cl.vidasalud.appointments.dto.TransitionStatusRequest;
import cl.vidasalud.appointments.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<List<Appointment>> getAll(
            @RequestParam(required = false) String patientRut,
            @RequestParam(required = false) AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.findAll(patientRut, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Appointment> create(@Valid @RequestBody CreateAppointmentRequest request) {
        Appointment created = appointmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Appointment> transitionStatus(
            @PathVariable Long id,
            @Valid @RequestBody TransitionStatusRequest request) {
        Appointment updated = appointmentService.transitionStatus(id, request.getNextStatus());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalStateException(IllegalStateException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", "Transición de Estado Inválida");
        error.put("message", ex.getMessage());
        error.put("status", HttpStatus.BAD_REQUEST.value());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<Map<String, Object>> handleNotFoundException(NoSuchElementException ex) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", "Recurso No Encontrado");
        error.put("message", ex.getMessage());
        error.put("status", HttpStatus.NOT_FOUND.value());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}
