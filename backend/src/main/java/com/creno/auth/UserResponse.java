package com.creno.auth;

import java.time.Instant;

import com.creno.user.Role;
import com.creno.user.User;

/** {@code previousLoginAt} : null à la première connexion. Sert au front à repérer les nouveautés. */
public record UserResponse(Long id, String email, String firstName, String lastName, String phone, Role role,
                           Instant previousLoginAt) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getPhone(), user.getRole(), user.getPreviousLoginAt());
    }
}
