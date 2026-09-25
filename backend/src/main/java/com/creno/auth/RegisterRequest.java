package com.creno.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72, message = "doit contenir entre 8 et 72 caractères") String password,
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @Pattern(regexp = "^$|^[+0-9 .-]{6,30}$", message = "numéro de téléphone invalide") String phone) {
}
