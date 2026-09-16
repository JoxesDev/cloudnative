package cl.vidasalud.appointments.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String patientRut;

    @Column(nullable = false)
    private Long serviceId;

    @Column(nullable = false)
    private Long boxId;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    public Appointment() {
    }

    public Appointment(String patientRut, Long serviceId, Long boxId, LocalDateTime scheduledAt, AppointmentStatus status) {
        this.patientRut = patientRut;
        this.serviceId = serviceId;
        this.boxId = boxId;
        this.scheduledAt = scheduledAt;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }
}
