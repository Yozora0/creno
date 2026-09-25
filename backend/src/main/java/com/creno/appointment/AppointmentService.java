package com.creno.appointment;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
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
import com.creno.user.User;
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
    private final ApplicationEventPublisher events;

    public AppointmentService(AppointmentRepository appointments, ServiceOfferingRepository services,
                              UserRepository users, AvailabilityService availability,
                              BusinessProperties business, Clock clock, ApplicationEventPublisher events) {
        this.appointments = appointments;
        this.services = services;
        this.users = users;
        this.availability = availability;
        this.business = business;
        this.clock = clock;
        this.events = events;
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
        // L'email part après le commit (cf. AppointmentNotifier) : pas d'email pour une réservation annulée par un rollback.
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Type.BOOKED, appointment.getId()));
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
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Type.CANCELLED_BY_CLIENT, appointment.getId()));
        return toResponse(appointment);
    }

    // ---------- Côté commerçant ----------

    @Transactional(readOnly = true)
    public List<AdminAppointmentResponse> planning(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new BusinessRuleException("La date de fin doit suivre la date de début.");
        }
        if (ChronoUnit.DAYS.between(from, to) > 31) {
            throw new BusinessRuleException("La période demandée ne peut pas dépasser 31 jours.");
        }
        ZoneId zone = business.zoneId();
        return appointments.findForPlanning(from.atStartOfDay(zone).toInstant(),
                        to.plusDays(1).atStartOfDay(zone).toInstant()).stream()
                .map(AdminAppointmentResponse::from)
                .toList();
    }

    /**
     * RDV pris depuis la connexion précédente du commerçant (pour le toast et le résumé du back-office).
     * Première connexion : pas de référence, donc rien de « nouveau ».
     */
    @Transactional(readOnly = true)
    public List<AdminAppointmentResponse> bookedSinceLastVisit(Long adminId) {
        User admin = users.findById(adminId).orElseThrow(() -> NotFoundException.of("Utilisateur", adminId));
        if (admin.getPreviousLoginAt() == null) {
            return List.of();
        }
        return appointments.findBookedCreatedSince(admin.getPreviousLoginAt()).stream()
                .limit(50)
                .map(AdminAppointmentResponse::from)
                .toList();
    }

    @Transactional
    public AdminAppointmentResponse changeStatusByShop(Long appointmentId, AppointmentStatus target) {
        Appointment appointment = appointments.findById(appointmentId)
                .orElseThrow(() -> NotFoundException.of("Rendez-vous", appointmentId));
        appointment.changeStatusByShop(target, clock.instant());
        if (target == AppointmentStatus.CANCELLED) {
            events.publishEvent(new AppointmentEvent(AppointmentEvent.Type.CANCELLED_BY_SHOP, appointment.getId()));
        }
        return AdminAppointmentResponse.from(appointment);
    }

    private AppointmentResponse toResponse(Appointment a) {
        return AppointmentResponse.from(a, a.isCancellableAt(clock.instant(), business.cancellationNotice()));
    }
}
