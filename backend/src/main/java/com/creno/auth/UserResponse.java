package com.creno.auth;

import com.creno.user.Role;
import com.creno.user.User;

public record UserResponse(Long id, String email, String firstName, String lastName, String phone, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getPhone(), user.getRole());
    }
}
