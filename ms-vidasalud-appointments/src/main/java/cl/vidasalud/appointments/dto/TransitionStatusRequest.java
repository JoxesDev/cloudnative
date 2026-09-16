package cl.vidasalud.appointments.dto;

import cl.vidasalud.appointments.domain.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public class TransitionStatusRequest {

    @NotNull(message = "El nuevo estado es requerido")
    private AppointmentStatus nextStatus;

    public TransitionStatusRequest() {
    }

    public TransitionStatusRequest(AppointmentStatus nextStatus) {
        this.nextStatus = nextStatus;
    }

    public AppointmentStatus getNextStatus() {
        return nextStatus;
    }

    public void setNextStatus(AppointmentStatus nextStatus) {
        this.nextStatus = nextStatus;
    }
}
