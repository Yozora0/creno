package com.creno.auth;

import java.time.Instant;
import java.util.List;

import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.creno.config.JwtProperties;
import com.creno.config.SecurityConfig;
import com.creno.user.User;

@Service
public class TokenService {

    private final JwtEncoder encoder;
    private final JwtProperties props;

    public TokenService(JwtEncoder encoder, JwtProperties props) {
        this.encoder = encoder;
        this.props = props;
    }

    public AuthResponse issue(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(props.expiration());

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("creno")
                .issuedAt(now)
                .expiresAt(expiresAt)
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim(SecurityConfig.ROLES_CLAIM, List.of(user.getRole().name()))
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, expiresAt, UserResponse.from(user));
    }
}
