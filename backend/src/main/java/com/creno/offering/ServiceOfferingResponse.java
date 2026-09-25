package com.creno.offering;

public record ServiceOfferingResponse(
        Long id, String name, String description, int durationMinutes, int priceCents, boolean active) {

    public static ServiceOfferingResponse from(ServiceOffering s) {
        return new ServiceOfferingResponse(s.getId(), s.getName(), s.getDescription(),
                s.getDurationMinutes(), s.getPriceCents(), s.isActive());
    }
}
