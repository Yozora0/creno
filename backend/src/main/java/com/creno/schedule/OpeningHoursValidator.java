package com.creno.schedule;

import java.time.DayOfWeek;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.creno.common.BusinessRuleException;

/**
 * Règles d'une semaine d'ouverture : chaque plage doit être cohérente
 * et deux plages d'un même jour ne peuvent pas se chevaucher.
 * Classe sans dépendance à Spring : testable en test unitaire pur.
 */
public final class OpeningHoursValidator {

    private OpeningHoursValidator() {
    }

    public static void validate(List<OpeningHourDto> slots) {
        for (OpeningHourDto slot : slots) {
            if (!slot.opensAt().isBefore(slot.closesAt())) {
                throw new BusinessRuleException(
                        "Plage invalide le " + label(slot.dayOfWeek()) + " : l'ouverture doit précéder la fermeture.");
            }
        }

        Map<DayOfWeek, List<OpeningHourDto>> byDay = slots.stream()
                .collect(Collectors.groupingBy(OpeningHourDto::dayOfWeek));

        byDay.forEach((day, daySlots) -> {
            List<OpeningHourDto> sorted = daySlots.stream()
                    .sorted(Comparator.comparing(OpeningHourDto::opensAt))
                    .toList();
            for (int i = 1; i < sorted.size(); i++) {
                // Triées par heure d'ouverture : il suffit de comparer chaque plage à la précédente.
                if (sorted.get(i).opensAt().isBefore(sorted.get(i - 1).closesAt())) {
                    throw new BusinessRuleException("Deux plages se chevauchent le " + label(day) + ".");
                }
            }
        });
    }

    private static String label(DayOfWeek day) {
        return switch (day) {
            case MONDAY -> "lundi";
            case TUESDAY -> "mardi";
            case WEDNESDAY -> "mercredi";
            case THURSDAY -> "jeudi";
            case FRIDAY -> "vendredi";
            case SATURDAY -> "samedi";
            case SUNDAY -> "dimanche";
        };
    }
}
