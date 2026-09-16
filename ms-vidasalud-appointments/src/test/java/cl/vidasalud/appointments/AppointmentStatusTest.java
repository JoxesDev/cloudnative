package cl.vidasalud.appointments;

import cl.vidasalud.appointments.domain.AppointmentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AppointmentStatusTest {

    @Test
    @DisplayName("Debe permitir transiciones válidas desde SOLICITADA")
    void testSolicitadaTransitions() {
        assertTrue(AppointmentStatus.SOLICITADA.canTransitionTo(AppointmentStatus.CONFIRMADA));
        assertTrue(AppointmentStatus.SOLICITADA.canTransitionTo(AppointmentStatus.CANCELADA));
        assertFalse(AppointmentStatus.SOLICITADA.canTransitionTo(AppointmentStatus.EN_ESPERA));
        assertFalse(AppointmentStatus.SOLICITADA.canTransitionTo(AppointmentStatus.EN_ATENCION));
        assertFalse(AppointmentStatus.SOLICITADA.canTransitionTo(AppointmentStatus.CERRADA));
    }

    @Test
    @DisplayName("Debe permitir transiciones válidas desde CONFIRMADA")
    void testConfirmadaTransitions() {
        assertTrue(AppointmentStatus.CONFIRMADA.canTransitionTo(AppointmentStatus.EN_ESPERA));
        assertTrue(AppointmentStatus.CONFIRMADA.canTransitionTo(AppointmentStatus.CANCELADA));
        assertFalse(AppointmentStatus.CONFIRMADA.canTransitionTo(AppointmentStatus.EN_ATENCION));
        assertFalse(AppointmentStatus.CONFIRMADA.canTransitionTo(AppointmentStatus.CERRADA));
    }

    @Test
    @DisplayName("Debe permitir transición desde EN_ESPERA a EN_ATENCION")
    void testEnEsperaTransitions() {
        assertTrue(AppointmentStatus.EN_ESPERA.canTransitionTo(AppointmentStatus.EN_ATENCION));
        assertFalse(AppointmentStatus.EN_ESPERA.canTransitionTo(AppointmentStatus.CONFIRMADA));
        assertFalse(AppointmentStatus.EN_ESPERA.canTransitionTo(AppointmentStatus.CERRADA));
    }

    @Test
    @DisplayName("Debe permitir transición desde EN_ATENCION a CERRADA")
    void testEnAtencionTransitions() {
        assertTrue(AppointmentStatus.EN_ATENCION.canTransitionTo(AppointmentStatus.CERRADA));
        assertFalse(AppointmentStatus.EN_ATENCION.canTransitionTo(AppointmentStatus.CANCELADA));
    }

    @Test
    @DisplayName("CERRADA y CANCELADA son estados terminales")
    void testTerminalStates() {
        for (AppointmentStatus next : AppointmentStatus.values()) {
            assertFalse(AppointmentStatus.CERRADA.canTransitionTo(next));
            assertFalse(AppointmentStatus.CANCELADA.canTransitionTo(next));
        }
    }
}
