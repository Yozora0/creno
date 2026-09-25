package com.creno.appointment;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    boolean existsByServiceId(Long serviceId);

    /** RDV dans un statut donné qui chevauchent l'intervalle [from, to). */
    @Query("""
            select a from Appointment a
            where a.status = :status and a.startAt < :to and a.endAt > :from
            """)
    List<Appointment> findOverlapping(@Param("status") AppointmentStatus status,
                                      @Param("from") Instant from,
                                      @Param("to") Instant to);

    /** Tous les RDV d'un client, prestation chargée en une seule requête (pas de N+1). */
    @Query("""
            select a from Appointment a join fetch a.service
            where a.client.id = :clientId
            order by a.startAt desc
            """)
    List<Appointment> findAllForClient(@Param("clientId") Long clientId);

    Optional<Appointment> findByIdAndClientId(Long id, Long clientId);
}
