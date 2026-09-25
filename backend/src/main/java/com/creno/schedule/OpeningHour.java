package com.creno.schedule;

import java.time.DayOfWeek;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Une plage d'ouverture hebdomadaire. Un jour peut en avoir plusieurs (ex. 9h-12h puis 14h-19h). */
@Entity
@Table(name = "opening_hours")
public class OpeningHour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "opens_at", nullable = false)
    private LocalTime opensAt;

    @Column(name = "closes_at", nullable = false)
    private LocalTime closesAt;

    protected OpeningHour() {
    }

    public OpeningHour(DayOfWeek dayOfWeek, LocalTime opensAt, LocalTime closesAt) {
        this.dayOfWeek = dayOfWeek;
        this.opensAt = opensAt;
        this.closesAt = closesAt;
    }

    public Long getId() { return id; }
    public DayOfWeek getDayOfWeek() { return dayOfWeek; }
    public LocalTime getOpensAt() { return opensAt; }
    public LocalTime getClosesAt() { return closesAt; }
}
