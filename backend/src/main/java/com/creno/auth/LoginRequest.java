package com.creno.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank @Email(message = "adresse email invalide") String email,
        @NotBlank String password) {

    public LoginRequest {
        email = RegisterRequest.normalizeEmail(email);
    }
}
