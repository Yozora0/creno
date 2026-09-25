package com.creno.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import com.creno.appointment.Appointment;
import com.creno.appointment.AppointmentEvent;
import com.creno.notification.AppointmentEmails.Email;
import com.creno.offering.ServiceOffering;
import com.creno.user.Role;
import com.creno.user.User;

/** Contenu des emails : test unitaire pur, sans serveur SMTP. */
class AppointmentEmailsTest {

    private final AppointmentEmails emails = new AppointmentEmails(
            new MailProperties("Salon Camille <no-reply@creno.dev>", "Salon Camille", "https://creno.example"),
            ZoneId.of("Europe/Paris"),
            Duration.ofHours(2));

    // 7 h 45 UTC le 6 octobre 2026 = 9 h 45 à Paris (heure d'été)
    private final Appointment appointment = new Appointment(
            new User("lea@exemple.fr", "x", "Léa", "Durand", null, Role.CLIENT),
            new ServiceOffering("Coupe femme", null, 45, 3800, true),
            Instant.parse("2026-10-06T07:45:00Z"),
            Instant.parse("2026-10-06T08:30:00Z"));

    @Test
    void confirmation_containsTheEssentials_inShopLocalTime() {
        Email email = emails.build(AppointmentEvent.Type.BOOKED, appointment);

        assertThat(email.to()).isEqualTo("lea@exemple.fr");
        assertThat(email.subject()).isEqualTo("Rendez-vous confirmé : mardi 6 octobre 2026 à 9h45");
        assertThat(email.body())
                .startsWith("Bonjour Léa,")
                .contains("Coupe femme (45 min)")
                .contains("38,00 €")
                .contains("jusqu'à 2 h avant")
                .contains("https://creno.example/mes-rendez-vous")
                .endsWith("Salon Camille");
    }

    @Test
    void cancellationByClient_confirmsTheCancellation() {
        Email email = emails.build(AppointmentEvent.Type.CANCELLED_BY_CLIENT, appointment);

        assertThat(email.subject()).startsWith("Rendez-vous annulé");
        assertThat(email.body()).contains("Nous confirmons l'annulation");
    }

    @Test
    void cancellationByShop_apologisesAndInvitesToRebook() {
        Email email = emails.build(AppointmentEvent.Type.CANCELLED_BY_SHOP, appointment);

        assertThat(email.subject()).isEqualTo("Votre rendez-vous du mardi 6 octobre 2026 à 9h45 est annulé");
        assertThat(email.body()).contains("désolés").contains("https://creno.example");
    }

}
