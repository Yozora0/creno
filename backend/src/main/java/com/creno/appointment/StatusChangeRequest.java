package com.creno.appointment;

import jakarta.validation.constraints.NotNull;

public record StatusChangeRequest(@NotNull AppointmentStatus status) {
}
