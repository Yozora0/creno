package com.creno.offering;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Catalogue public : seules les prestations actives sont visibles. */
@RestController
@RequestMapping("/api/services")
public class ServiceOfferingController {

    private final ServiceOfferingService service;

    public ServiceOfferingController(ServiceOfferingService service) {
        this.service = service;
    }

    @GetMapping
    public List<ServiceOfferingResponse> list() {
        return service.listActive();
    }

    @GetMapping("/{id}")
    public ServiceOfferingResponse get(@PathVariable Long id) {
        return service.getActive(id);
    }
}
