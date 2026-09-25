package com.creno.offering;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.creno.appointment.AppointmentRepository;
import com.creno.common.ConflictException;
import com.creno.common.NotFoundException;

@Service
public class ServiceOfferingService {

    private final ServiceOfferingRepository repository;
    private final AppointmentRepository appointments;

    public ServiceOfferingService(ServiceOfferingRepository repository, AppointmentRepository appointments) {
        this.repository = repository;
        this.appointments = appointments;
    }

    @Transactional(readOnly = true)
    public List<ServiceOfferingResponse> listActive() {
        return repository.findAllByActiveTrueOrderByNameAsc().stream().map(ServiceOfferingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ServiceOfferingResponse getActive(Long id) {
        return repository.findByIdAndActiveTrue(id)
                .map(ServiceOfferingResponse::from)
                .orElseThrow(() -> NotFoundException.of("Prestation", id));
    }

    @Transactional(readOnly = true)
    public List<ServiceOfferingResponse> listAll() {
        return repository.findAllByOrderByNameAsc().stream().map(ServiceOfferingResponse::from).toList();
    }

    @Transactional
    public ServiceOfferingResponse create(ServiceOfferingRequest req) {
        ServiceOffering saved = repository.save(new ServiceOffering(
                req.name().trim(), clean(req.description()), req.durationMinutes(), req.priceCents(),
                req.activeOrDefault()));
        return ServiceOfferingResponse.from(saved);
    }

    @Transactional
    public ServiceOfferingResponse update(Long id, ServiceOfferingRequest req) {
        ServiceOffering offering = find(id);
        offering.update(req.name().trim(), clean(req.description()), req.durationMinutes(), req.priceCents(),
                req.activeOrDefault());
        return ServiceOfferingResponse.from(offering);
    }

    /**
     * Une prestation déjà réservée ne peut pas être supprimée (on perdrait l'historique) :
     * il faut la désactiver.
     */
    @Transactional
    public void delete(Long id) {
        ServiceOffering offering = find(id);
        if (appointments.existsByServiceId(id)) {
            throw new ConflictException("Cette prestation a déjà des rendez-vous : désactivez-la plutôt que de la supprimer.");
        }
        repository.delete(offering);
    }

    private ServiceOffering find(Long id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Prestation", id));
    }

    private static String clean(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
