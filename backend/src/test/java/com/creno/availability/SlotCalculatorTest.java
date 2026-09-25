package com.creno.availability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.creno.availability.SlotCalculator.BusyInterval;
import com.creno.availability.SlotCalculator.OpeningRange;
import com.creno.availability.SlotCalculator.Slot;

/** Tests unitaires purs de l'algorithme de créneaux : aucun Spring, aucune base. */
class SlotCalculatorTest {

    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");
    private static final LocalDate TUESDAY = LocalDate.of(2026, 10, 6);
    private static final Duration STEP = Duration.ofMinutes(15);
    private static final Instant LONG_AGO = Instant.EPOCH;

    private static OpeningRange range(String from, String to) {
        return new OpeningRange(LocalTime.parse(from), LocalTime.parse(to));
    }

    private static Instant at(LocalDate date, String time) {
        return date.atTime(LocalTime.parse(time)).atZone(PARIS).toInstant();
    }

    private static BusyInterval busy(String from, String to) {
        return new BusyInterval(at(TUESDAY, from), at(TUESDAY, to));
    }

    private static List<String> times(List<Slot> slots) {
        return slots.stream().map(s -> s.localStart().toString()).toList();
    }

    private static List<Slot> compute(List<OpeningRange> ranges, List<BusyInterval> busy, int minutes, Instant notBefore) {
        return SlotCalculator.compute(TUESDAY, PARIS, ranges, busy, Duration.ofMinutes(minutes), STEP, notBefore);
    }

    @Test
    void proposesASlotEveryStep_aslongAsTheServiceFitsBeforeClosing() {
        List<Slot> slots = compute(List.of(range("09:00", "10:00")), List.of(), 30, LONG_AGO);

        // 9h45 est exclu : une prestation de 30 min finirait à 10h15, après la fermeture.
        assertThat(times(slots)).containsExactly("09:00", "09:15", "09:30");
        assertThat(slots.getFirst().end()).isEqualTo(at(TUESDAY, "09:30"));
    }

    @Test
    void serviceLongerThanTheRange_hasNoSlot() {
        assertThat(compute(List.of(range("09:00", "10:00")), List.of(), 90, LONG_AGO)).isEmpty();
    }

    @Test
    void lunchBreak_splitsTheDay() {
        List<Slot> slots = compute(List.of(range("14:00", "15:00"), range("09:00", "10:00")), List.of(), 60, LONG_AGO);

        assertThat(times(slots)).containsExactly("09:00", "14:00");
    }

    @Test
    void existingAppointment_blocksEveryOverlappingSlot_butNotAdjacentOnes() {
        List<Slot> slots = compute(List.of(range("09:00", "11:00")), List.of(busy("09:30", "10:00")), 30, LONG_AGO);

        // 9h15 (9h15-9h45) et 9h45 (9h45-10h15) chevauchent 9h30-10h ; 9h00 et 10h00 sont collés : autorisés.
        assertThat(times(slots)).containsExactly("09:00", "10:00", "10:15", "10:30");
    }

    @Test
    void slotsBeforeNotBefore_areExcluded() {
        List<Slot> slots = compute(List.of(range("09:00", "11:00")), List.of(), 30, at(TUESDAY, "10:05"));

        assertThat(times(slots)).containsExactly("10:15", "10:30");
    }

    @Test
    void slotStartingExactlyAtNotBefore_isKept() {
        List<Slot> slots = compute(List.of(range("09:00", "10:00")), List.of(), 30, at(TUESDAY, "09:15"));

        assertThat(times(slots)).containsExactly("09:15", "09:30");
    }

    @Test
    void convertsLocalTimesWithTheRightOffset_aroundDaylightSavingChange() {
        // Passage à l'heure d'hiver le dimanche 25 octobre 2026 : UTC+2 avant, UTC+1 après.
        LocalDate summer = LocalDate.of(2026, 10, 23);
        LocalDate winter = LocalDate.of(2026, 10, 27);

        Slot summerSlot = SlotCalculator.compute(summer, PARIS, List.of(range("09:00", "09:30")), List.of(),
                Duration.ofMinutes(30), STEP, LONG_AGO).getFirst();
        Slot winterSlot = SlotCalculator.compute(winter, PARIS, List.of(range("09:00", "09:30")), List.of(),
                Duration.ofMinutes(30), STEP, LONG_AGO).getFirst();

        assertThat(summerSlot.start()).isEqualTo(Instant.parse("2026-10-23T07:00:00Z"));
        assertThat(winterSlot.start()).isEqualTo(Instant.parse("2026-10-27T08:00:00Z"));
    }

    @Test
    void noOpeningRange_meansNoSlot() {
        assertThat(compute(List.of(), List.of(), 30, LONG_AGO)).isEmpty();
    }

    @Test
    void rejectsNonPositiveDurations() {
        assertThatThrownBy(() -> compute(List.of(range("09:00", "10:00")), List.of(), 0, LONG_AGO))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
