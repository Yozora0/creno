package com.creno.offering;

import com.creno.common.InputPatterns;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ServiceOfferingRequest(
        @NotBlank @Size(max = 120)
        @Pattern(regexp = InputPatterns.SINGLE_LINE_TEXT, message = InputPatterns.SINGLE_LINE_TEXT_MESSAGE) String name,
        @Size(max = 1000)
        @Pattern(regexp = InputPatterns.SINGLE_LINE_TEXT, message = InputPatterns.SINGLE_LINE_TEXT_MESSAGE) String description,
        @NotNull @Min(5) @Max(480) Integer durationMinutes,
        @NotNull @Min(0) Integer priceCents,
        Boolean active) {

    public boolean activeOrDefault() {
        return active == null || active;
    }
}
