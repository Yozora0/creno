package com.creno.appointment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.creno.AbstractIntegrationTest;
import com.creno.common.ConflictException;
import com.creno.offering.ServiceOffering;
import com.creno.offering.ServiceOfferingRepository;
import com.creno.schedule.Closure;
import com.creno.schedule.ClosureRepository;
import com.creno.schedule.OpeningHour;
import com.creno.schedule.OpeningHourRepository;
import com.creno.user.Role;
import com.creno.user.User;

class AppointmentControllerTest extends AbstractIntegrationTest {

    private static final ZoneId PARIS = ZoneId.of("Europe/Paris");

    @Autowired AppointmentRepository appointments;
    @Autowired AppointmentService appointmentService;
    @Autowired ServiceOfferingRepository services;
    @Autowired OpeningHourRepository openingHours;
    @Autowired ClosureRepository closures;

    private ServiceOffering haircut;
    private LocalDate day;

    @BeforeEach
    void setUp() {
        appointments.deleteAll();
        closures.deleteAll();
        openingHours.deleteAll();
        for (DayOfWeek d : DayOfWeek.values()) {
            openingHours.save(new OpeningHour(d, LocalTime.of(9, 0), LocalTime.of(18, 0)));
        }
        haircut = services.save(new ServiceOffering("Coupe test", null, 30, 2500, true));
        day = LocalDate.now(PARIS).plusDays(7);
    }

    private Instant at(String time) {
        return day.atTime(LocalTime.parse(time)).atZone(PARIS).toInstant();
    }

    private ResultActions book(String token, Instant startAt) throws Exception {
        return mockMvc.perform(post("/api/appointments")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(new BookingRequest(haircut.getId(), startAt))));
    }

    private ResultActions availability() throws Exception {
        return mockMvc.perform(get("/api/services/" + haircut.getId() + "/availability").param("date", day.toString()));
    }

    @Test
    void availability_isPublic_andListsSlotsOfTheDay() throws Exception {
        // 9h → 18h, prestation de 30 min, un début toutes les 15 min : 9h00 … 17h30 = 35 créneaux
        availability()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(35))
                .andExpect(jsonPath("$[0].time").value("09:00"))
                .andExpect(jsonPath("$[0].startAt").value(at("09:00").toString()))
                .andExpect(jsonPath("$[34].time").value("17:30"));
    }

    @Test
    void closedDay_hasNoSlot() throws Exception {
        closures.save(new Closure(day, day, "Formation"));

        availability().andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void client_booksASlot_whichDisappearsFromAvailability() throws Exception {
        book(bearer(Role.CLIENT), at("09:00"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("BOOKED"))
                .andExpect(jsonPath("$.serviceName").value("Coupe test"))
                .andExpect(jsonPath("$.endAt").value(at("09:30").toString()))
                .andExpect(jsonPath("$.cancellable").value(true));

        // 9h00 est pris et 9h15 (9h15-9h45) chevaucherait : le premier créneau libre est 9h30.
        availability()
                .andExpect(jsonPath("$[0].time").value("09:30"))
                .andExpect(jsonPath("$[*].time", not(hasItem("09:15"))));
    }

    @Test
    void sameSlot_cannotBeBookedTwice() throws Exception {
        book(bearer(Role.CLIENT), at("10:00")).andExpect(status().isCreated());

        book(bearer(Role.CLIENT), at("10:00"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value(AppointmentService.SLOT_TAKEN));
    }

    @Test
    void startTimeThatIsNotAProposedSlot_isRejected() throws Exception {
        book(bearer(Role.CLIENT), at("10:07")).andExpect(status().isConflict()); // pas aligné sur le pas de 15 min
        book(bearer(Role.CLIENT), at("17:45")).andExpect(status().isConflict()); // finirait après la fermeture
        book(bearer(Role.CLIENT), at("07:00")).andExpect(status().isConflict()); // avant l'ouverture
    }

    @Test
    void anonymous_cannotBook() throws Exception {
        mockMvc.perform(post("/api/appointments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new BookingRequest(haircut.getId(), at("09:00")))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void client_seesAndCancelsOwnAppointment_butNotSomeoneElses() throws Exception {
        String owner = bearer(Role.CLIENT);
        String body = book(owner, at("11:00")).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(body).get("id").asLong();

        mockMvc.perform(get("/api/appointments/me").header("Authorization", owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id));

        // Un autre client ne voit pas ce RDV et ne peut pas l'annuler (404 : on ne révèle pas son existence).
        String stranger = bearer(Role.CLIENT);
        mockMvc.perform(get("/api/appointments/me").header("Authorization", stranger))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(post("/api/appointments/" + id + "/cancel").header("Authorization", stranger))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/appointments/" + id + "/cancel").header("Authorization", owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancellable").value(false));

        // Une fois annulé, le créneau redevient disponible.
        availability().andExpect(jsonPath("$[*].time", hasItem("11:00")));
    }

    @Test
    void cancellingTooLate_isRefused() throws Exception {
        User client = userRepository.save(new User(uniqueEmail("late"), "x", "Late", "Client", null, Role.CLIENT));
        Instant soon = Instant.now().plus(Duration.ofMinutes(30)); // moins de 2 h avant le RDV
        Appointment appointment = appointments.save(
                new Appointment(client, haircut, soon, soon.plus(Duration.ofMinutes(30))));

        mockMvc.perform(post("/api/appointments/" + appointment.getId() + "/cancel")
                        .header("Authorization", "Bearer " + tokenService.issue(client).token()))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void concurrentBookingsOfTheSameSlot_onlyOneSucceeds() throws Exception {
        int clients = 8;
        List<Long> clientIds = new ArrayList<>();
        for (int i = 0; i < clients; i++) {
            clientIds.add(userRepository.save(
                    new User(uniqueEmail("race"), "x", "Race", "Client" + i, null, Role.CLIENT)).getId());
        }
        BookingRequest sameSlot = new BookingRequest(haircut.getId(), at("15:00"));

        // Tous les threads attendent le même signal pour réserver au même instant.
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(clients);
        List<Future<Boolean>> results = new ArrayList<>();
        for (Long clientId : clientIds) {
            Callable<Boolean> attempt = () -> {
                start.await();
                try {
                    appointmentService.book(clientId, sameSlot);
                    return true;
                } catch (ConflictException e) {
                    return false;
                }
            };
            results.add(pool.submit(attempt));
        }
        start.countDown();

        int successes = 0;
        for (Future<Boolean> result : results) {
            if (result.get()) successes++;
        }
        pool.shutdown();

        assertThat(successes).isEqualTo(1);
        assertThat(appointments.findOverlapping(AppointmentStatus.BOOKED, at("15:00"), at("15:30"))).hasSize(1);
    }
}
