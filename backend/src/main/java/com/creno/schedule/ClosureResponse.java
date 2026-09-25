package com.creno.schedule;

import java.time.LocalDate;

public record ClosureResponse(Long id, LocalDate startDate, LocalDate endDate, String reason) {

    public static ClosureResponse from(Closure c) {
        return new ClosureResponse(c.getId(), c.getStartDate(), c.getEndDate(), c.getReason());
    }
}
