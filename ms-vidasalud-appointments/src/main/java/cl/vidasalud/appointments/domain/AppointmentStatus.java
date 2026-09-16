package cl.vidasalud.appointments.domain;

public enum AppointmentStatus {
    SOLICITADA,
    CONFIRMADA,
    EN_ESPERA,
    EN_ATENCION,
    CERRADA,
    CANCELADA;

    public boolean canTransitionTo(AppointmentStatus next) {
        if (this == SOLICITADA && (next == CONFIRMADA || next == CANCELADA)) return true;
        if (this == CONFIRMADA && (next == EN_ESPERA || next == CANCELADA)) return true;
        if (this == EN_ESPERA && next == EN_ATENCION) return true;
        if (this == EN_ATENCION && next == CERRADA) return true;
        return false;
    }
}
