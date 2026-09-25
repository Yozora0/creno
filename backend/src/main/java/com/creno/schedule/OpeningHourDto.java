package com.creno.schedule;

import java.time.DayOfWeek;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotNull;

/** Plage d'ouverture, utilisée en entrée comme en sortie. Heures au format "HH:mm". */
public record OpeningHourDto(
        @NotNull DayOfWeek dayOfWeek,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime opensAt,
        @NotNull @JsonFormat(pattern = "HH:mm") LocalTime closesAt) {

    public static OpeningHourDto from(OpeningHour h) {
        return new OpeningHourDto(h.getDayOfWeek(), h.getOpensAt(), h.getClosesAt());
    }
}
