package cl.vidasalud.appointments.repository;

import cl.vidasalud.appointments.domain.Appointment;
import cl.vidasalud.appointments.domain.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientRut(String patientRut);
    List<Appointment> findByStatus(AppointmentStatus status);
}
