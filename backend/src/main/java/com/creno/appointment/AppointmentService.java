package com.creno.appointment;

import java.time.Clock;
import java.time.Duration;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.creno.availability.AvailabilityService;
import com.creno.common.BusinessRuleException;
import com.creno.common.ConflictException;
import com.creno.common.NotFoundException;
import com.creno.config.BusinessProperties;
import com.creno.offering.ServiceOffering;
import com.creno.offering.ServiceOfferingRepository;
import com.creno.user.UserRepository;

@Service
public class AppointmentService {

    static final String SLOT_TAKEN = "Ce créneau n'est plus disponible. Merci d'en choisir un autre.";

    private final AppointmentRepository appointments;
    private final ServiceOfferingRepository services;
    private final UserRepository users;
    private final AvailabilityService availability;
    private final BusinessProperties business;
    private final Clock clock;

    public AppointmentService(AppointmentRepository appointments, ServiceOfferingRepository services,
                              UserRepository users, AvailabilityService availability,
                              BusinessProperties business, Clock clock) {
        this.appointments = appointments;
        this.services = services;
        this.users = users;
        this.availability = availability;
        this.business = business;
        this.clock = clock;
    }

    /**
     * Réservation en deux barrières :
     * <ol>
     *   <li>vérification applicative : le début doit correspondre à un créneau réellement proposé
     *       (horaires, fermetures, délai minimum, RDV existants) ;</li>
     *   <li>contrainte d'exclusion PostgreSQL : si deux clients passent la 1re barrière au même instant,
     *       la base refuse le second INSERT. On traduit alors l'erreur en 409 lisible.</li>
     * </ol>
     */
    @Transactional
    public AppointmentResponse book(Long clientId, BookingRequest request) {
        ServiceOffering service = services.findByIdAndActiveTrue(request.serviceId())
                .orElseThrow(() -> NotFoundException.of("Prestation", request.serviceId()));

        if (!availability.isBookable(service, request.startAt())) {
            throw new ConflictException(SLOT_TAKEN);
        }

        Appointment appointment = new Appointment(
                users.getReferenceById(clientId),
                service,
                request.startAt(),
                request.startAt().plus(Duration.ofMinutes(service.getDurationMinutes())));
        try {
            appointments.saveAndFlush(appointment); // flush immédiat pour que la contrainte SQL s'applique ici
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException(SLOT_TAKEN);
        }
        return toResponse(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> myAppointments(Long clientId) {
        return appointments.findAllForClient(clientId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public AppointmentResponse cancel(Long clientId, Long appointmentId) {
        // Le RDV d'un autre client renvoie 404 : on ne confirme même pas son existence.
        Appointment appointment = appointments.findByIdAndClientId(appointmentId, clientId)
                .orElseThrow(() -> NotFoundException.of("Rendez-vous", appointmentId));

        if (appointment.getStatus() != AppointmentStatus.BOOKED) {
            throw new ConflictException("Ce rendez-vous n'est plus actif.");
        }
        if (!appointment.isCancellableAt(clock.instant(), business.cancellationNotice())) {
            throw new BusinessRuleException("L'annulation en ligne est possible jusqu'à "
                    + business.cancellationNotice().toHours() + " h avant le rendez-vous. Merci de contacter le salon.");
        }
        appointment.cancel();
        return toResponse(appointment);
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.from(a, a.isCancellableAt(clock.instant(), business.cancellationNotice()));
    }
}
