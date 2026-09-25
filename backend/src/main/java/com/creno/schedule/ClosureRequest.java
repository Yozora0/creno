package com.creno.schedule;

import java.time.LocalDate;

import com.creno.common.InputPatterns;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClosureRequest(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @Size(max = 255)
        @Pattern(regexp = InputPatterns.SINGLE_LINE_TEXT, message = InputPatterns.SINGLE_LINE_TEXT_MESSAGE) String reason) {

    @JsonIgnore
    @AssertTrue(message = "la date de fin doit être égale ou postérieure à la date de début")
    public boolean isRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}
