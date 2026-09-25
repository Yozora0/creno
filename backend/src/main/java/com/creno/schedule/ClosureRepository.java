package com.creno.schedule;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ClosureRepository extends JpaRepository<Closure, Long> {

    /** Fermetures en cours ou à venir. */
    List<Closure> findAllByEndDateGreaterThanEqualOrderByStartDateAsc(LocalDate date);

    /** Vrai si une fermeture couvre ce jour (startDate <= date <= endDate). */
    default boolean isClosedOn(LocalDate date) {
        return existsByStartDateLessThanEqualAndEndDateGreaterThanEqual(date, date);
    }

    boolean existsByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate start, LocalDate end);
}
