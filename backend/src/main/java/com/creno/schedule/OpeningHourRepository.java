package com.creno.schedule;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OpeningHourRepository extends JpaRepository<OpeningHour, Long> {

    List<OpeningHour> findAllByOrderByOpensAtAsc();
}
