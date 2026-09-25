package com.creno.availability;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public : on peut consulter les créneaux sans être connecté (la connexion est demandée au moment de réserver). */
@RestController
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    /** Ex. GET /api/services/3/availability?date=2026-10-06 */
    @GetMapping("/api/services/{serviceId}/availability")
    public List<SlotResponse> availability(@PathVariable Long serviceId,
                                           @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return availabilityService.availableSlots(serviceId, date);
    }
}
