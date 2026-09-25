package com.creno.common;

/** Violation d'une règle métier liée à l'état actuel des données (HTTP 409). */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
