package com.creno.appointment;

public enum AppointmentStatus {
    /** Réservé, créneau occupé. */
    BOOKED,
    /** Le client est venu. */
    COMPLETED,
    /** Le client ne s'est pas présenté. */
    NO_SHOW,
    /** Annulé (par le client ou le commerce) : le créneau est libéré. */
    CANCELLED
}
