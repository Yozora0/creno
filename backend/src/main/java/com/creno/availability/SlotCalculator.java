package com.creno.availability;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Cœur métier : calcule les créneaux libres d'une journée.
 *
 * <p>Algorithme :
 * <ol>
 *   <li>pour chaque plage d'ouverture du jour (ex. 9h-12h), on propose un début toutes les {@code step} minutes ;</li>
 *   <li>on ne garde un début que si la prestation entière tient avant la fermeture de la plage ;</li>
 *   <li>on écarte les créneaux qui chevauchent un rendez-vous existant ;</li>
 *   <li>on écarte les créneaux qui commencent trop tôt (passés ou trop proches de maintenant).</li>
 * </ol>
 *
 * <p>Classe pure, sans Spring ni base de données : toutes les entrées sont passées en paramètre,
 * ce qui la rend simple à tester unitairement (y compris les cas limites comme le changement d'heure).
 */
public final class SlotCalculator {

    /** Plage d'ouverture locale, ex. 09:00 → 12:00. */
    public record OpeningRange(LocalTime opensAt, LocalTime closesAt) {
    }

    /** Intervalle déjà occupé, en instants absolus. Borne de fin exclue. */
    public record BusyInterval(Instant start, Instant end) {
    }

    /** Créneau proposé au client. */
    public record Slot(Instant start, Instant end, LocalTime localStart) {
    }

    private SlotCalculator() {
    }

    public static List<Slot> compute(LocalDate date,
                                     ZoneId zone,
                                     List<OpeningRange> openingRanges,
                                     List<BusyInterval> busy,
                                     Duration serviceDuration,
                                     Duration step,
                                     Instant notBefore) {
        if (serviceDuration.isZero() || serviceDuration.isNegative() || step.isZero() || step.isNegative()) {
            throw new IllegalArgumentException("La durée et le pas doivent être strictement positifs.");
        }

        List<Slot> slots = new ArrayList<>();
        List<OpeningRange> ranges = openingRanges.stream()
                .sorted(Comparator.comparing(OpeningRange::opensAt))
                .toList();

        for (OpeningRange range : ranges) {
            // On raisonne en instants absolus : un jour de changement d'heure dure 23 h ou 25 h,
            // et l'heure locale seule ne suffit pas à calculer correctement la fin d'un créneau.
            Instant rangeEnd = date.atTime(range.closesAt()).atZone(zone).toInstant();
            Instant start = date.atTime(range.opensAt()).atZone(zone).toInstant();

            while (!start.plus(serviceDuration).isAfter(rangeEnd)) {
                Instant end = start.plus(serviceDuration);
                if (!start.isBefore(notBefore) && isFree(start, end, busy)) {
                    slots.add(new Slot(start, end, start.atZone(zone).toLocalTime()));
                }
                start = start.plus(step);
            }
        }
        return slots;
    }

    /** Deux intervalles [a,b) et [c,d) se chevauchent si a < d et c < b. */
    static boolean isFree(Instant start, Instant end, List<BusyInterval> busy) {
        return busy.stream().noneMatch(b -> start.isBefore(b.end()) && b.start().isBefore(end));
    }
}
