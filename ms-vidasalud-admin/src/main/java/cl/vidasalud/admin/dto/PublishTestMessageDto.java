package cl.vidasalud.admin.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para la publicación de mensajes de prueba desde la API REST o interfaz web.
 */
public class PublishTestMessageDto {

    @NotBlank(message = "El exchange es obligatorio")
    private String exchange;

    @NotBlank(message = "La routing key es obligatoria")
    private String routingKey;

    private String message;
    private Long appointmentId = 101L;
    private String patientRut = "12.345.678-9";
    private boolean simulateError = false;

    public PublishTestMessageDto() {}

    public PublishTestMessageDto(String exchange, String routingKey, String message, boolean simulateError) {
        this.exchange = exchange;
        this.routingKey = routingKey;
        this.message = message;
        this.simulateError = simulateError;
    }

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getRoutingKey() {
        return routingKey;
    }

    public void setRoutingKey(String routingKey) {
        this.routingKey = routingKey;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
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

    public boolean isSimulateError() {
        return simulateError;
    }

    public void setSimulateError(boolean simulateError) {
        this.simulateError = simulateError;
    }
}
