package com.creno.offering;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/** Gestion des prestations par le commerçant (rôle ADMIN, cf. SecurityConfig). */
@RestController
@RequestMapping("/api/admin/services")
public class AdminServiceOfferingController {

    private final ServiceOfferingService service;

    public AdminServiceOfferingController(ServiceOfferingService service) {
        this.service = service;
    }

    @GetMapping
    public List<ServiceOfferingResponse> listAll() {
        return service.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServiceOfferingResponse create(@Valid @RequestBody ServiceOfferingRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ServiceOfferingResponse update(@PathVariable Long id, @Valid @RequestBody ServiceOfferingRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
