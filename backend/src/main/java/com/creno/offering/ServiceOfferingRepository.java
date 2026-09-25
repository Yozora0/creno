package com.creno.offering;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, Long> {

    List<ServiceOffering> findAllByActiveTrueOrderByNameAsc();

    List<ServiceOffering> findAllByOrderByNameAsc();

    Optional<ServiceOffering> findByIdAndActiveTrue(Long id);
}
