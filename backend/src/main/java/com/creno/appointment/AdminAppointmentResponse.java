package com.creno.appointment;

import java.time.Instant;

import com.creno.offering.ServiceOffering;
import com.creno.user.User;

/** Vue commerçant d'un RDV : contrairement à la vue client, elle expose les coordonnées du client. */
public record AdminAppointmentResponse(
        Long id,
        Instant startAt,
        Instant endAt,
        AppointmentStatus status,
        Instant createdAt,
        Long serviceId,
        String serviceName,
        int priceCents,
        Long clientId,
        String clientName,
        String clientEmail,
        String clientPhone) {

    static AdminAppointmentResponse from(Appointment a) {
        ServiceOffering s = a.getService();
        User c = a.getClient();
        return new AdminAppointmentResponse(a.getId(), a.getStartAt(), a.getEndAt(), a.getStatus(), a.getCreatedAt(),
                s.getId(), s.getName(), s.getPriceCents(),
                c.getId(), c.getFirstName() + " " + c.getLastName(), c.getEmail(), c.getPhone());
    }
}
