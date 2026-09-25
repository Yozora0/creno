package com.creno.appointment;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;

/** {@code startAt} : valeur renvoyée par l'endpoint de disponibilités (instant ISO-8601, ex. "2026-10-06T07:00:00Z"). */
public record BookingRequest(@NotNull Long serviceId, @NotNull Instant startAt) {
}
