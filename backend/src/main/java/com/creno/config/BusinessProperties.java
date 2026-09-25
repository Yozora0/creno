package com.creno.config;

import java.time.Duration;
import java.time.ZoneId;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Règles de fonctionnement du commerce.
 *
 * @param zoneId              fuseau du commerce : "9h" dans les horaires = 9h à Paris
 * @param slotStep            pas entre deux débuts de créneau proposés (ex. toutes les 15 min)
 * @param bookingHorizonDays  on peut réserver jusqu'à N jours à l'avance
 * @param minBookingNotice    délai minimum entre maintenant et le début d'un RDV réservé
 * @param cancellationNotice  un client peut annuler jusqu'à ce délai avant le RDV
 */
@ConfigurationProperties(prefix = "creno.business")
public record BusinessProperties(
        ZoneId zoneId,
        Duration slotStep,
        Integer bookingHorizonDays,
        Duration minBookingNotice,
        Duration cancellationNotice) {

    public BusinessProperties {
        if (zoneId == null) zoneId = ZoneId.of("Europe/Paris");
        if (slotStep == null) slotStep = Duration.ofMinutes(15);
        if (bookingHorizonDays == null) bookingHorizonDays = 60;
        if (minBookingNotice == null) minBookingNotice = Duration.ofHours(1);
        if (cancellationNotice == null) cancellationNotice = Duration.ofHours(2);
    }
}
