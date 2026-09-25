package com.creno.schedule;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.creno.AbstractIntegrationTest;
import com.creno.user.Role;

class ScheduleControllerTest extends AbstractIntegrationTest {

    private static OpeningHourDto slot(DayOfWeek day, int from, int to) {
        return new OpeningHourDto(day, LocalTime.of(from, 0), LocalTime.of(to, 0));
    }

    @Test
    void admin_replacesWeek_andPublicSeesItSorted() throws Exception {
        WeeklyScheduleRequest week = new WeeklyScheduleRequest(List.of(
                slot(DayOfWeek.SATURDAY, 9, 17),
                slot(DayOfWeek.TUESDAY, 14, 19),
                slot(DayOfWeek.TUESDAY, 9, 12)));

        mockMvc.perform(put("/api/admin/opening-hours")
                        .header("Authorization", bearer(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(week)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/opening-hours"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].dayOfWeek").value("TUESDAY"))
                .andExpect(jsonPath("$[0].opensAt").value("09:00"))
                .andExpect(jsonPath("$[1].opensAt").value("14:00"))
                .andExpect(jsonPath("$[2].dayOfWeek").value("SATURDAY"));
    }

    @Test
    void overlappingSlots_areRejected() throws Exception {
        WeeklyScheduleRequest week = new WeeklyScheduleRequest(List.of(
                slot(DayOfWeek.MONDAY, 9, 13),
                slot(DayOfWeek.MONDAY, 12, 18)));

        mockMvc.perform(put("/api/admin/opening-hours")
                        .header("Authorization", bearer(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(week)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void closure_withEndBeforeStart_isRejected() throws Exception {
        LocalDate today = LocalDate.now();
        ClosureRequest invalid = new ClosureRequest(today.plusDays(5), today.plusDays(2), "Congés");

        mockMvc.perform(post("/api/admin/closures")
                        .header("Authorization", bearer(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void admin_addsClosure_andPublicSeesIt() throws Exception {
        LocalDate start = LocalDate.now().plusDays(30);
        ClosureRequest closure = new ClosureRequest(start, start.plusDays(6), "Congés d'été");

        mockMvc.perform(post("/api/admin/closures")
                        .header("Authorization", bearer(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(closure)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber());

        mockMvc.perform(get("/api/closures"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.reason == \"Congés d'été\")]").exists());
    }
}
