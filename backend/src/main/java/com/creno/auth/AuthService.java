package com.creno.auth;

import java.util.Locale;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.creno.common.ConflictException;
import com.creno.common.NotFoundException;
import com.creno.user.Role;
import com.creno.user.User;
import com.creno.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    /** L'inscription publique crée toujours un CLIENT : un admin ne peut pas s'auto-déclarer. */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.email());
        if (users.existsByEmail(email)) {
            throw new ConflictException("Un compte existe déjà avec cet email.");
        }
        User user = users.save(new User(
                email,
                passwordEncoder.encode(request.password()),
                request.firstName().trim(),
                request.lastName().trim(),
                StringUtils.hasText(request.phone()) ? request.phone().trim() : null,
                Role.CLIENT));
        return tokenService.issue(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmail(normalize(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                // Même message que l'email existe ou non : on ne révèle pas les comptes existants.
                .orElseThrow(() -> new BadCredentialsException("invalid credentials"));
        return tokenService.issue(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return users.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> NotFoundException.of("Utilisateur", userId));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
