package com.creno.schedule;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.creno.common.BusinessRuleException;

/** Test unitaire pur : pas de Spring, pas de base, exécution instantanée. */
class OpeningHoursValidatorTest {

    private static OpeningHourDto slot(DayOfWeek day, String from, String to) {
        return new OpeningHourDto(day, LocalTime.parse(from), LocalTime.parse(to));
    }

    @Test
    void acceptsDayWithLunchBreak() {
        assertThatCode(() -> OpeningHoursValidator.validate(List.of(
                slot(DayOfWeek.TUESDAY, "09:00", "12:00"),
                slot(DayOfWeek.TUESDAY, "14:00", "19:00"))))
                .doesNotThrowAnyException();
    }

    @Test
    void acceptsContiguousSlots() {
        assertThatCode(() -> OpeningHoursValidator.validate(List.of(
                slot(DayOfWeek.MONDAY, "09:00", "12:00"),
                slot(DayOfWeek.MONDAY, "12:00", "18:00"))))
                .doesNotThrowAnyException();
    }

    @Test
    void acceptsSameHoursOnDifferentDays() {
        assertThatCode(() -> OpeningHoursValidator.validate(List.of(
                slot(DayOfWeek.MONDAY, "09:00", "18:00"),
                slot(DayOfWeek.TUESDAY, "09:00", "18:00"))))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsOverlapEvenWhenUnsorted() {
        assertThatThrownBy(() -> OpeningHoursValidator.validate(List.of(
                slot(DayOfWeek.FRIDAY, "14:00", "19:00"),
                slot(DayOfWeek.FRIDAY, "09:00", "14:30"))))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("vendredi");
    }

    @Test
    void rejectsSlotClosingBeforeOpening() {
        assertThatThrownBy(() -> OpeningHoursValidator.validate(List.of(
                slot(DayOfWeek.MONDAY, "18:00", "09:00"))))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    void rejectsEmptySlot() {
        assertThatThrownBy(() -> OpeningHoursValidator.validate(List.of(
                slot(DayOfWeek.MONDAY, "09:00", "09:00"))))
                .isInstanceOf(BusinessRuleException.class);
    }
}
