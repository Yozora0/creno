package com.creno.notification;

import java.text.NumberFormat;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import com.creno.appointment.Appointment;
import com.creno.appointment.AppointmentEvent;

/**
 * Rédaction des emails liés aux rendez-vous. Classe pure (pas d'envoi, pas de Spring) :
 * le contenu se teste unitairement, l'envoi est géré par {@link AppointmentNotifier}.
 */
public final class AppointmentEmails {

    public record Email(String to, String subject, String body) {
    }

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale.FRENCH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("H'h'mm", Locale.FRENCH);

    private final MailProperties mail;
    private final ZoneId zone;
    private final Duration cancellationNotice;

    public AppointmentEmails(MailProperties mail, ZoneId zone, Duration cancellationNotice) {
        this.mail = mail;
        this.zone = zone;
        this.cancellationNotice = cancellationNotice;
    }

    public Email build(AppointmentEvent.Type type, Appointment a) {
        ZonedDateTime start = a.getStartAt().atZone(zone);
        String when = DAY.format(start) + " à " + TIME.format(start);
        String service = a.getService().getName();
        String greeting = "Bonjour " + a.getClient().getFirstName() + ",\n\n";
        String signature = "\n\nÀ bientôt,\n" + mail.shopName();
        String myAppointments = mail.frontendUrl() + "/mes-rendez-vous";

        return switch (type) {
            case BOOKED -> new Email(a.getClient().getEmail(),
                    "Rendez-vous confirmé : " + when,
                    greeting
                            + "Votre rendez-vous est confirmé.\n\n"
                            + "  Prestation : " + service + " (" + a.getService().getDurationMinutes() + " min)\n"
                            + "  Date       : " + when + "\n"
                            + "  Prix       : " + price(a.getService().getPriceCents()) + ", à régler sur place\n\n"
                            + "Un empêchement ? Vous pouvez annuler jusqu'à " + cancellationNotice.toHours()
                            + " h avant depuis votre espace : " + myAppointments
                            + signature);
            case CANCELLED_BY_CLIENT -> new Email(a.getClient().getEmail(),
                    "Rendez-vous annulé : " + when,
                    greeting
                            + "Nous confirmons l'annulation de votre rendez-vous « " + service + " » du " + when + ".\n\n"
                            + "Pour reprendre rendez-vous : " + mail.frontendUrl()
                            + signature);
            case CANCELLED_BY_SHOP -> new Email(a.getClient().getEmail(),
                    "Votre rendez-vous du " + when + " est annulé",
                    greeting
                            + "Nous sommes désolés : nous devons annuler votre rendez-vous « " + service + " » du " + when + ".\n\n"
                            + "Vous pouvez choisir un nouveau créneau ici : " + mail.frontendUrl()
                            + signature);
        };
    }

    private static String price(int cents) {
        // Espace insécable remplacée par une espace simple : plus lisible dans un email texte.
        return NumberFormat.getCurrencyInstance(Locale.FRANCE).format(cents / 100.0).replace(' ', ' ').replace(' ', ' ');
    }
}
