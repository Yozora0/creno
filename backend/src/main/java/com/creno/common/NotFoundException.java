package com.creno.common;

public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }

    public static NotFoundException of(String resource, Object id) {
        return new NotFoundException(resource + " introuvable (id=" + id + ")");
    }
}
