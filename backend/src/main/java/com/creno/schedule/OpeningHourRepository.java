package com.creno.schedule;

import java.time.DayOfWeek;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OpeningHourRepository extends JpaRepository<OpeningHour, Long> {

    List<OpeningHour> findAllByOrderByOpensAtAsc();

    List<OpeningHour> findAllByDayOfWeek(DayOfWeek dayOfWeek);
}
