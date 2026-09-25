package com.creno.availability;

import java.time.Instant;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * Créneau disponible. {@code startAt} (instant UTC) est la valeur à renvoyer pour réserver ;
 * {@code time} est l'heure locale du commerce, prête à afficher ("09:15").
 */
public record SlotResponse(Instant startAt, Instant endAt, @JsonFormat(pattern = "HH:mm") LocalTime time) {

    static SlotResponse from(SlotCalculator.Slot slot) {
        return new SlotResponse(slot.start(), slot.end(), slot.localStart());
    }
}
