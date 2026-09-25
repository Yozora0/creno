package com.creno.appointment;

import java.time.Instant;

import com.creno.offering.ServiceOffering;

public record AppointmentResponse(
        Long id,
        Long serviceId,
        String serviceName,
        int durationMinutes,
        int priceCents,
        Instant startAt,
        Instant endAt,
        AppointmentStatus status,
        Instant createdAt,
        /** Calculé côté serveur : le front n'a pas à connaître la règle d'annulation. */
        boolean cancellable) {

    static AppointmentResponse from(Appointment a, boolean cancellable) {
        ServiceOffering s = a.getService();
        return new AppointmentResponse(a.getId(), s.getId(), s.getName(), s.getDurationMinutes(), s.getPriceCents(),
                a.getStartAt(), a.getEndAt(), a.getStatus(), a.getCreatedAt(), cancellable);
    }
}
