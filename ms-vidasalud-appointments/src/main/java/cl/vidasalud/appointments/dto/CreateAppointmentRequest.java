package cl.vidasalud.appointments.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CreateAppointmentRequest {

    @NotBlank(message = "El RUT del paciente es obligatorio")
    private String patientRut;

    @NotNull(message = "El ID del servicio es obligatorio")
    private Long serviceId;

    @NotNull(message = "El ID del box es obligatorio")
    private Long boxId;

    @NotNull(message = "La fecha/hora programada es obligatoria")
    private LocalDateTime scheduledAt;

    public CreateAppointmentRequest() {
    }

    public CreateAppointmentRequest(String patientRut, Long serviceId, Long boxId, LocalDateTime scheduledAt) {
        this.patientRut = patientRut;
        this.serviceId = serviceId;
        this.boxId = boxId;
        this.scheduledAt = scheduledAt;
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

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
}
