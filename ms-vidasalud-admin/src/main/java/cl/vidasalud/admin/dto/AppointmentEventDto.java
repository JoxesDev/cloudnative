package cl.vidasalud.admin.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Evento de dominio de Atención Médica.
 * Utilizado por productores y consumidores asíncronos.
 */
public class AppointmentEventDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long appointmentId;
    private String patientRut;
    private Long serviceId;
    private Long boxId;
    private String scheduledAt;
    private String status;
    private String eventType;
    private boolean simulateError;
    private LocalDateTime timestamp;

    public AppointmentEventDto() {
        this.timestamp = LocalDateTime.now();
    }

    public AppointmentEventDto(Long appointmentId, String patientRut, Long serviceId, Long boxId,
                               String scheduledAt, String status, String eventType, boolean simulateError) {
        this.appointmentId = appointmentId;
        this.patientRut = patientRut;
        this.serviceId = serviceId;
        this.boxId = boxId;
        this.scheduledAt = scheduledAt;
        this.status = status;
        this.eventType = eventType;
        this.simulateError = simulateError;
        this.timestamp = LocalDateTime.now();
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public String getPatientRut() {
        return patientRut;
    }

    public void setPatientRut(String patientRut) {
        this.patientRut = patientRut;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public Long getBoxId() {
        return boxId;
    }

    public void setBoxId(Long boxId) {
        this.boxId = boxId;
    }

    public String getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(String scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public boolean isSimulateError() {
        return simulateError;
    }

    public void setSimulateError(boolean simulateError) {
        this.simulateError = simulateError;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
