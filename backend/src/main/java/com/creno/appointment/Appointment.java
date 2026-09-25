package com.creno.appointment;

import java.time.Duration;
import java.time.Instant;

import com.creno.common.BusinessRuleException;
import com.creno.offering.ServiceOffering;
import com.creno.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Rendez-vous d'un client pour une prestation. Le chevauchement de deux RDV actifs
 * est interdit par la contrainte SQL ex_appointments_no_overlap (cf. V1__init_schema.sql).
 */
@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceOffering service;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Appointment() {
    }

    public Appointment(User client, ServiceOffering service, Instant startAt, Instant endAt) {
        this.client = client;
        this.service = service;
        this.startAt = startAt;
        this.endAt = endAt;
        this.status = AppointmentStatus.BOOKED;
        this.createdAt = Instant.now();
    }

    /** Un client peut annuler un RDV réservé tant qu'il reste au moins {@code notice} avant son début. */
    public boolean isCancellableAt(Instant now, Duration notice) {
        return status == AppointmentStatus.BOOKED && !now.plus(notice).isAfter(startAt);
    }

    /** Réservé aux données de démonstration : simule un RDV pris il y a quelque temps. */
    public void backdateCreation(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public void cancel() {
        this.status = AppointmentStatus.CANCELLED;
    }

    /**
     * Changement de statut par le commerçant. Règles :
     * <ul>
     *   <li>annuler : seulement un RDV encore réservé ;</li>
     *   <li>honoré / absent : seulement une fois le RDV commencé (on peut corriger l'un en l'autre) ;</li>
     *   <li>jamais de retour à « réservé » : le créneau a pu être repris entre-temps.</li>
     * </ul>
     */
    public void changeStatusByShop(AppointmentStatus target, Instant now) {
        switch (target) {
            case CANCELLED -> {
                if (status != AppointmentStatus.BOOKED) {
                    throw new BusinessRuleException("Seul un rendez-vous réservé peut être annulé.");
                }
            }
            case COMPLETED, NO_SHOW -> {
                if (status == AppointmentStatus.CANCELLED) {
                    throw new BusinessRuleException("Ce rendez-vous a été annulé.");
                }
                if (now.isBefore(startAt)) {
                    throw new BusinessRuleException("Le rendez-vous n'a pas encore commencé.");
                }
            }
            case BOOKED -> throw new BusinessRuleException("Un rendez-vous ne peut pas repasser à l'état réservé.");
        }
        this.status = target;
    }

    public Long getId() { return id; }
    public User getClient() { return client; }
    public ServiceOffering getService() { return service; }
    public Instant getStartAt() { return startAt; }
    public Instant getEndAt() { return endAt; }
    public AppointmentStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
