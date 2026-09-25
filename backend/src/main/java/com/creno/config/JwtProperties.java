package com.creno.config;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "creno.jwt")
public record JwtProperties(String secret, Duration expiration) {

    public JwtProperties {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("creno.jwt.secret doit faire au moins 32 octets (HS256).");
        }
        if (expiration == null) {
            expiration = Duration.ofHours(8);
        }
    }
}
