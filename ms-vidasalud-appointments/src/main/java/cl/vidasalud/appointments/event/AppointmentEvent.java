package cl.vidasalud.appointments.event;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Evento de dominio de atención médica emitido al broker RabbitMQ.
 */
public class AppointmentEvent implements Serializable {

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

    public AppointmentEvent() {
        this.timestamp = LocalDateTime.now();
    }

    public AppointmentEvent(Long appointmentId, String patientRut, Long serviceId, Long boxId,
                            String scheduledAt, String status, String eventType) {
        this.appointmentId = appointmentId;
        this.patientRut = patientRut;
        this.serviceId = serviceId;
        this.boxId = boxId;
        this.scheduledAt = scheduledAt;
        this.status = status;
        this.eventType = eventType;
        this.simulateError = false;
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
