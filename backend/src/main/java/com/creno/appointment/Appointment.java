package com.creno.appointment;

import java.time.Instant;

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
 * Rendez-vous. La logique de réservation (calcul des créneaux, anti double-réservation)
 * arrive en semaine 2 ; l'entité et la contrainte SQL d'exclusion sont déjà en place.
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

    public Long getId() { return id; }
    public User getClient() { return client; }
    public ServiceOffering getService() { return service; }
    public Instant getStartAt() { return startAt; }
    public Instant getEndAt() { return endAt; }
    public AppointmentStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
