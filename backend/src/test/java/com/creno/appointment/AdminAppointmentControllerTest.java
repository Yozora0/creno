package com.creno.appointment;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.creno.AbstractIntegrationTest;
import com.creno.offering.ServiceOffering;
import com.creno.offering.ServiceOfferingRepository;
import com.creno.user.Role;
import com.creno.user.User;

class AdminAppointmentControllerTest extends AbstractIntegrationTest {

    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");

    @Autowired AppointmentRepository appointments;
    @Autowired ServiceOfferingRepository services;

    private ServiceOffering service;
    private User client;
    private String admin;

    @BeforeEach
    void setUp() {
        appointments.deleteAll();
        service = services.save(new ServiceOffering("Couleur test", null, 60, 5500, true));
        client = userRepository.save(new User(uniqueEmail("planning"), "x", "Inès", "Moreau", "06 00 00 00 00", Role.CLIENT));
        admin = bearer(Role.ADMIN);
    }

    /** Insertion directe : on veut des RDV passés, impossibles à créer via l'API de réservation. */
    private Appointment appointmentAt(Instant start) {
        return appointments.save(new Appointment(client, service, start, start.plus(Duration.ofMinutes(60))));
    }

    private ResultActions changeStatus(long id, String status) throws Exception {
        return mockMvc.perform(patch("/api/admin/appointments/" + id + "/status")
                .header("Authorization", admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\"}"));
    }

    @Test
    void planning_listsAppointmentsOfThePeriod_withClientDetails() throws Exception {
        LocalDate day = LocalDate.now(PARIS).plusDays(3);
        Instant inRange = day.atTime(10, 0).atZone(PARIS).toInstant();
        Instant outOfRange = day.plusDays(10).atTime(10, 0).atZone(PARIS).toInstant();
        long inId = appointmentAt(inRange).getId();
        long outId = appointmentAt(outOfRange).getId();

        mockMvc.perform(get("/api/admin/appointments")
                        .param("from", day.toString())
                        .param("to", day.plusDays(6).toString())
                        .header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", hasItem((int) inId)))
                .andExpect(jsonPath("$[*].id", not(hasItem((int) outId))))
                .andExpect(jsonPath("$[0].clientName").value("Inès Moreau"))
                .andExpect(jsonPath("$[0].clientPhone").value("06 00 00 00 00"))
                .andExpect(jsonPath("$[0].serviceName").value("Couleur test"));
    }

    @Test
    void planning_isReservedToAdmins() throws Exception {
        LocalDate today = LocalDate.now(PARIS);
        mockMvc.perform(get("/api/admin/appointments")
                        .param("from", today.toString()).param("to", today.plusDays(6).toString())
                        .header("Authorization", bearer(Role.CLIENT)))
                .andExpect(status().isForbidden());
    }

    @Test
    void planning_rejectsPeriodsLongerThan31Days() throws Exception {
        LocalDate today = LocalDate.now(PARIS);
        mockMvc.perform(get("/api/admin/appointments")
                        .param("from", today.toString()).param("to", today.plusDays(40).toString())
                        .header("Authorization", admin))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void shop_canCancelAnUpcomingAppointment_butNotMarkItCompleted() throws Exception {
        long id = appointmentAt(Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS)).getId();

        changeStatus(id, "COMPLETED").andExpect(status().isUnprocessableEntity());
        changeStatus(id, "CANCELLED").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));
        changeStatus(id, "CANCELLED").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void shop_marksAPastAppointment_asNoShowThenCorrectsIt() throws Exception {
        long id = appointmentAt(Instant.now().minus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS)).getId();

        changeStatus(id, "NO_SHOW").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("NO_SHOW"));
        changeStatus(id, "COMPLETED").andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"));
        changeStatus(id, "BOOKED").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void unknownStatus_isABadRequest() throws Exception {
        long id = appointmentAt(Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS)).getId();

        changeStatus(id, "PAYE").andExpect(status().isBadRequest());
    }

    @Test
    void recent_listsBookingsMadeSinceThePreviousLogin() throws Exception {
        User shopOwner = new User(uniqueEmail("owner"), "x", "Camille", "Martin", null, Role.ADMIN);
        shopOwner.recordLogin(Instant.now().minus(1, ChronoUnit.HOURS)); // connexion précédente
        shopOwner.recordLogin(Instant.now());                            // connexion en cours
        shopOwner = userRepository.save(shopOwner);
        String token = "Bearer " + tokenService.issue(shopOwner).token();

        Instant oldStart = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Appointment old = new Appointment(client, service, oldStart, oldStart.plus(Duration.ofMinutes(60)));
        old.backdateCreation(Instant.now().minus(2, ChronoUnit.HOURS)); // pris avant la connexion précédente
        appointments.save(old); // (created_at n'est pas modifiable après insertion : on date avant d'enregistrer)
        long fresh = appointmentAt(Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS)).getId();
        Appointment cancelled = appointmentAt(Instant.now().plus(4, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS));
        cancelled.cancel();
        appointments.save(cancelled);

        mockMvc.perform(get("/api/admin/appointments/recent").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value((int) fresh))
                .andExpect(jsonPath("$[0].createdAt").isNotEmpty());
    }

    @Test
    void recent_isEmptyOnFirstLogin() throws Exception {
        appointmentAt(Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS));

        // Compte sans connexion précédente : aucune référence, donc rien de « nouveau ».
        mockMvc.perform(get("/api/admin/appointments/recent").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
