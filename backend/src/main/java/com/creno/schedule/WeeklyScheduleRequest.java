package com.creno.schedule;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Remplace toute la semaine d'un coup : plus simple côté front qu'un CRUD plage par plage. */
public record WeeklyScheduleRequest(@NotNull @Size(max = 50) List<@Valid @NotNull OpeningHourDto> slots) {
}
