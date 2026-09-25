package com.creno.appointment;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/** Espace client : l'identité vient toujours du token, jamais du corps de la requête. */
@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppointmentResponse book(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody BookingRequest request) {
        return appointmentService.book(userId(jwt), request);
    }

    @GetMapping("/me")
    public List<AppointmentResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return appointmentService.myAppointments(userId(jwt));
    }

    @PostMapping("/{id}/cancel")
    public AppointmentResponse cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
        return appointmentService.cancel(userId(jwt), id);
    }

    private static Long userId(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}
