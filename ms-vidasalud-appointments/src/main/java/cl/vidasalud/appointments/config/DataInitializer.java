package cl.vidasalud.appointments.config;

import cl.vidasalud.appointments.domain.Appointment;
import cl.vidasalud.appointments.domain.AppointmentStatus;
import cl.vidasalud.appointments.repository.AppointmentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initData(AppointmentRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                LocalDateTime now = LocalDateTime.now();
                repository.saveAll(List.of(
                        new Appointment("12345678-9", 101L, 1L, now.plusHours(2), AppointmentStatus.SOLICITADA),
                        new Appointment("18765432-1", 102L, 2L, now.plusHours(4), AppointmentStatus.CONFIRMADA),
                        new Appointment("11223344-5", 101L, 1L, now.minusMinutes(15), AppointmentStatus.EN_ESPERA),
                        new Appointment("19988776-K", 103L, 3L, now.minusMinutes(30), AppointmentStatus.EN_ATENCION),
                        new Appointment("15544332-8", 102L, 2L, now.minusHours(2), AppointmentStatus.CERRADA),
                        new Appointment("17654321-0", 101L, 1L, now.minusDays(1), AppointmentStatus.CANCELADA)
                ));
            }
        };
    }
}
