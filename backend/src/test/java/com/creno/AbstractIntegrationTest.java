package com.creno;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

import com.creno.auth.TokenService;
import com.creno.user.Role;
import com.creno.user.User;
import com.creno.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Base des tests d'intégration : vrai PostgreSQL (Testcontainers), migrations Flyway
 * appliquées, sécurité active. Le conteneur est partagé entre toutes les classes de test
 * (pattern "singleton container") pour garder des tests rapides.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected TokenService tokenService;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    protected String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    protected static String uniqueEmail(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@test.dev";
    }

    protected String bearer(Role role) {
        User user = userRepository.save(new User(uniqueEmail(role.name().toLowerCase()),
                passwordEncoder.encode("Password123!"), "Test", "User", null, role));
        return "Bearer " + tokenService.issue(user).token();
    }
}
