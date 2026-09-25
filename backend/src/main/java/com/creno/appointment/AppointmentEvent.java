package com.creno.appointment;

/** Publié dans la transaction qui modifie le RDV ; traité après son commit. */
public record AppointmentEvent(Type type, Long appointmentId) {

    public enum Type {
        BOOKED,
        CANCELLED_BY_CLIENT,
        CANCELLED_BY_SHOP
    }
}
