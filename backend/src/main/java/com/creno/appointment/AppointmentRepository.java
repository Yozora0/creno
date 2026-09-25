package com.creno.appointment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByServiceId(Long serviceId);
}
