package cl.vidasalud.appointments.service;

import cl.vidasalud.appointments.domain.Appointment;
import cl.vidasalud.appointments.domain.AppointmentStatus;
import cl.vidasalud.appointments.dto.CreateAppointmentRequest;
import cl.vidasalud.appointments.repository.AppointmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public List<Appointment> findAll(String patientRut, AppointmentStatus status) {
        if (patientRut != null && !patientRut.isBlank()) {
            return appointmentRepository.findByPatientRut(patientRut);
        }
        if (status != null) {
            return appointmentRepository.findByStatus(status);
        }
        return appointmentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Appointment findById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Atención no encontrada con ID: " + id));
    }

    public Appointment create(CreateAppointmentRequest request) {
        Appointment appointment = new Appointment(
                request.getPatientRut(),
                request.getServiceId(),
                request.getBoxId(),
                request.getScheduledAt(),
                AppointmentStatus.SOLICITADA
        );
        return appointmentRepository.save(appointment);
    }

    public Appointment transitionStatus(Long id, AppointmentStatus nextStatus) {
        Appointment appointment = findById(id);
        AppointmentStatus currentStatus = appointment.getStatus();

        if (!currentStatus.canTransitionTo(nextStatus)) {
            throw new IllegalStateException(String.format(
                    "Transición no permitida: no se puede cambiar de %s a %s para la atención ID %d",
                    currentStatus, nextStatus, id
            ));
        }

        appointment.setStatus(nextStatus);
        return appointmentRepository.save(appointment);
    }

    public void delete(Long id) {
        Appointment appointment = findById(id);
        appointmentRepository.delete(appointment);
    }
}
