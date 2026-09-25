package com.creno.availability;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.creno.appointment.AppointmentRepository;
import com.creno.appointment.AppointmentStatus;
import com.creno.availability.SlotCalculator.BusyInterval;
import com.creno.availability.SlotCalculator.OpeningRange;
import com.creno.availability.SlotCalculator.Slot;
import com.creno.common.NotFoundException;
import com.creno.config.BusinessProperties;
import com.creno.offering.ServiceOffering;
import com.creno.offering.ServiceOfferingRepository;
import com.creno.schedule.ClosureRepository;
import com.creno.schedule.OpeningHourRepository;

/**
 * Rassemble les données (horaires, fermetures, RDV existants) puis délègue le calcul à {@link SlotCalculator}.
 */
@Service
public class AvailabilityService {

    private final ServiceOfferingRepository services;
    private final OpeningHourRepository openingHours;
    private final ClosureRepository closures;
    private final AppointmentRepository appointments;
    private final BusinessProperties business;
    private final Clock clock;

    public AvailabilityService(ServiceOfferingRepository services, OpeningHourRepository openingHours,
                               ClosureRepository closures, AppointmentRepository appointments,
                               BusinessProperties business, Clock clock) {
        this.services = services;
        this.openingHours = openingHours;
        this.closures = closures;
        this.appointments = appointments;
        this.business = business;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<SlotResponse> availableSlots(Long serviceId, LocalDate date) {
        ServiceOffering service = services.findByIdAndActiveTrue(serviceId)
                .orElseThrow(() -> NotFoundException.of("Prestation", serviceId));
        return compute(service, date).stream().map(SlotResponse::from).toList();
    }

    /**
     * Vérifie qu'un début de RDV correspond exactement à un créneau proposé.
     * Utilisé à la réservation : on ne fait jamais confiance à l'heure envoyée par le client.
     */
    @Transactional(readOnly = true)
    public boolean isBookable(ServiceOffering service, Instant startAt) {
        LocalDate date = startAt.atZone(business.zoneId()).toLocalDate();
        return compute(service, date).stream().anyMatch(slot -> slot.start().equals(startAt));
    }

    private List<Slot> compute(ServiceOffering service, LocalDate date) {
        ZoneId zone = business.zoneId();
        LocalDate today = LocalDate.now(clock.withZone(zone));
        if (date.isBefore(today) || date.isAfter(today.plusDays(business.bookingHorizonDays()))) {
            return List.of();
        }
        if (closures.isClosedOn(date)) {
            return List.of();
        }

        List<OpeningRange> ranges = openingHours.findAllByDayOfWeek(date.getDayOfWeek()).stream()
                .map(h -> new OpeningRange(h.getOpensAt(), h.getClosesAt()))
                .toList();
        if (ranges.isEmpty()) {
            return List.of();
        }

        Instant dayStart = date.atStartOfDay(zone).toInstant();
        Instant dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant();
        List<BusyInterval> busy = appointments.findOverlapping(AppointmentStatus.BOOKED, dayStart, dayEnd).stream()
                .map(a -> new BusyInterval(a.getStartAt(), a.getEndAt()))
                .toList();

        return SlotCalculator.compute(
                date,
                zone,
                ranges,
                busy,
                Duration.ofMinutes(service.getDurationMinutes()),
                business.slotStep(),
                clock.instant().plus(business.minBookingNotice()));
    }
}
