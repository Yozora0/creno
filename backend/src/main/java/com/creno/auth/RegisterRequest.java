package com.creno.auth;

import java.util.Locale;

import com.creno.common.InputPatterns;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email(message = "adresse email invalide") @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 72, message = "doit contenir entre 8 et 72 caractères") String password,
        @NotBlank @Size(max = 100)
        @Pattern(regexp = InputPatterns.PERSON_NAME, message = InputPatterns.PERSON_NAME_MESSAGE) String firstName,
        @NotBlank @Size(max = 100)
        @Pattern(regexp = InputPatterns.PERSON_NAME, message = InputPatterns.PERSON_NAME_MESSAGE) String lastName,
        @Pattern(regexp = "^$|^[+0-9 .-]{6,30}$", message = "numéro de téléphone invalide") String phone) {

    /** Normalisé avant validation : " Lea@Mail.fr " et "lea@mail.fr" désignent le même compte. */
    public RegisterRequest {
        email = normalizeEmail(email);
        firstName = trim(firstName);
        lastName = trim(lastName);
        phone = trim(phone);
    }

    private static String trim(String value) {
        return value == null ? null : value.strip();
    }

    static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
