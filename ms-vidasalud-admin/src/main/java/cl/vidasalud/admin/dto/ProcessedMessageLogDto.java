package cl.vidasalud.admin.dto;

import java.time.LocalDateTime;

public class ProcessedMessageLogDto {

    private String id;
    private String queue;
    private Long appointmentId;
    private String patientRut;
    private String status;
    private String action;
    private String details;
    private long deliveryTag;
    private LocalDateTime timestamp;

    public ProcessedMessageLogDto() {
        this.timestamp = LocalDateTime.now();
    }

    public ProcessedMessageLogDto(String id, String queue, Long appointmentId, String patientRut,
                                 String status, String action, String details, long deliveryTag) {
        this.id = id;
        this.queue = queue;
        this.appointmentId = appointmentId;
        this.patientRut = patientRut;
        this.status = status;
        this.action = action;
        this.details = details;
        this.deliveryTag = deliveryTag;
        this.timestamp = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getQueue() {
        return queue;
    }

    public void setQueue(String queue) {
        this.queue = queue;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public long getDeliveryTag() {
        return deliveryTag;
    }

    public void setDeliveryTag(long deliveryTag) {
        this.deliveryTag = deliveryTag;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
