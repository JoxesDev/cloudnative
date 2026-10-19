package cl.vidasalud.appointments.service;

import cl.vidasalud.appointments.domain.Appointment;
import cl.vidasalud.appointments.domain.AppointmentStatus;
import cl.vidasalud.appointments.dto.CreateAppointmentRequest;
import cl.vidasalud.appointments.producer.AppointmentEventPublisher;
import cl.vidasalud.appointments.repository.AppointmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceMessagingTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private AppointmentEventPublisher eventPublisher;

    private AppointmentService appointmentService;

    @BeforeEach
    void setUp() {
        appointmentService = new AppointmentService(appointmentRepository, eventPublisher);
    }

    @Test
    @DisplayName("Crear atención médica debe disparar evento asíncrono publishAppointmentCreated")
    void testCreatePublishesEvent() {
        CreateAppointmentRequest request = new CreateAppointmentRequest();
        request.setPatientRut("12.345.678-9");
        request.setServiceId(1L);
        request.setBoxId(101L);
        request.setScheduledAt(LocalDateTime.now().plusDays(1));

        Appointment savedAppointment = new Appointment("12.345.678-9", 1L, 101L, request.getScheduledAt(), AppointmentStatus.SOLICITADA);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedAppointment);

        Appointment result = appointmentService.create(request);

        assertNotNull(result);
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
        verify(eventPublisher, times(1)).publishAppointmentCreated(savedAppointment);
    }

    @Test
    @DisplayName("Transición de estado debe disparar evento asíncrono publishAppointmentStatusChanged")
    void testTransitionPublishesEvent() {
        Appointment existing = new Appointment("12.345.678-9", 1L, 101L, LocalDateTime.now(), AppointmentStatus.SOLICITADA);
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Appointment updated = appointmentService.transitionStatus(1L, AppointmentStatus.CONFIRMADA);

        assertEquals(AppointmentStatus.CONFIRMADA, updated.getStatus());
        verify(eventPublisher, times(1)).publishAppointmentStatusChanged(any(Appointment.class));
    }
}
