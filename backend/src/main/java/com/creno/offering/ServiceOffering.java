package com.creno.offering;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Une prestation proposée par le commerce (ex. "Coupe homme", 30 min, 25 €).
 * Nommée ServiceOffering pour éviter la confusion avec l'annotation @Service de Spring.
 */
@Entity
@Table(name = "services")
public class ServiceOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    /** Prix en centimes : jamais de double pour de l'argent. */
    @Column(name = "price_cents", nullable = false)
    private int priceCents;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ServiceOffering() {
    }

    public ServiceOffering(String name, String description, int durationMinutes, int priceCents, boolean active) {
        update(name, description, durationMinutes, priceCents, active);
        this.createdAt = Instant.now();
    }

    public void update(String name, String description, int durationMinutes, int priceCents, boolean active) {
        this.name = name;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.priceCents = priceCents;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public int getDurationMinutes() { return durationMinutes; }
    public int getPriceCents() { return priceCents; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}
