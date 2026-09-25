package com.creno.common;

/** Donnée syntaxiquement valide mais refusée par une règle métier (HTTP 422). */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
