package com.creno.demo;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.creno.appointment.Appointment;
import com.creno.appointment.AppointmentRepository;
import com.creno.appointment.AppointmentStatus;
import com.creno.config.BusinessProperties;
import com.creno.offering.ServiceOffering;
import com.creno.offering.ServiceOfferingRepository;
import com.creno.schedule.OpeningHour;
import com.creno.schedule.OpeningHourRepository;
import com.creno.user.Role;
import com.creno.user.User;
import com.creno.user.UserRepository;

/**
 * Jeu de données de démonstration (profil "demo") : un salon de coiffure fictif, un compte commerçant,
 * des clients et un planning déjà rempli, pour que l'application soit parlante dès la première visite.
 * Idempotent : ne fait rien si la base contient déjà des utilisateurs.
 */
@Component
@Profile("demo")
public class DemoDataInitializer implements ApplicationRunner {

    public static final String ADMIN_EMAIL = "admin@creno.dev";
    public static final String CLIENT_EMAIL = "client@creno.dev";

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    /** Horaires proposés pour les RDV de démo, piochés à tour de rôle. */
    private static final List<LocalTime> DEMO_TIMES = List.of(
            LocalTime.of(9, 30), LocalTime.of(11, 0), LocalTime.of(14, 0), LocalTime.of(15, 45), LocalTime.of(17, 30));

    private final UserRepository users;
    private final ServiceOfferingRepository services;
    private final OpeningHourRepository openingHours;
    private final AppointmentRepository appointments;
    private final PasswordEncoder passwordEncoder;
    private final BusinessProperties business;
    private final Clock clock;

    public DemoDataInitializer(UserRepository users, ServiceOfferingRepository services,
                               OpeningHourRepository openingHours, AppointmentRepository appointments,
                               PasswordEncoder passwordEncoder, BusinessProperties business, Clock clock) {
        this.users = users;
        this.services = services;
        this.openingHours = openingHours;
        this.appointments = appointments;
        this.passwordEncoder = passwordEncoder;
        this.business = business;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }

        users.save(new User(ADMIN_EMAIL, passwordEncoder.encode("Admin123!"),
                "Camille", "Martin", "02 54 00 00 00", Role.ADMIN));
        User lea = users.save(new User(CLIENT_EMAIL, passwordEncoder.encode("Client123!"),
                "Léa", "Durand", "06 12 34 56 78", Role.CLIENT));

        // Autres clients fictifs : mot de passe aléatoire, ils ne servent qu'à remplir le planning.
        String unusable = passwordEncoder.encode(UUID.randomUUID().toString());
        List<User> clients = new ArrayList<>(List.of(lea));
        clients.add(users.save(new User("hugo.petit@exemple.fr", unusable, "Hugo", "Petit", "06 23 45 67 89", Role.CLIENT)));
        clients.add(users.save(new User("ines.moreau@exemple.fr", unusable, "Inès", "Moreau", null, Role.CLIENT)));
        clients.add(users.save(new User("tom.leroy@exemple.fr", unusable, "Tom", "Leroy", "07 34 56 78 90", Role.CLIENT)));

        List<ServiceOffering> offer = services.saveAll(List.of(
                new ServiceOffering("Coupe femme", "Shampoing, coupe et brushing.", 45, 3800, true),
                new ServiceOffering("Coupe homme", "Shampoing et coupe aux ciseaux ou à la tondeuse.", 30, 2400, true),
                new ServiceOffering("Coupe enfant", "Pour les moins de 12 ans.", 20, 1500, true),
                new ServiceOffering("Couleur", "Coloration complète, shampoing soin inclus.", 90, 5500, true),
                new ServiceOffering("Barbe", "Taille et contours au rasoir.", 20, 1500, true)));

        List<OpeningHour> week = new ArrayList<>();
        for (DayOfWeek day : List.of(DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
            week.add(new OpeningHour(day, LocalTime.of(9, 0), LocalTime.of(12, 0)));
            week.add(new OpeningHour(day, LocalTime.of(14, 0), LocalTime.of(19, 0)));
        }
        week.add(new OpeningHour(DayOfWeek.SATURDAY, LocalTime.of(9, 0), LocalTime.of(17, 0)));
        openingHours.saveAll(week);

        int created = seedAppointments(week, clients, offer);
        log.info("Données de démo créées ({} RDV) : {} / Admin123! et {} / Client123!", created, ADMIN_EMAIL, CLIENT_EMAIL);
    }

    /** Quelques RDV passés (honorés ou non) et à venir, sur les jours d'ouverture autour d'aujourd'hui. */
    private int seedAppointments(List<OpeningHour> week, List<User> clients, List<ServiceOffering> offer) {
        LocalDate today = LocalDate.now(clock.withZone(business.zoneId()));
        Instant now = clock.instant();
        int count = 0;
        int turn = 0;

        for (int offset = -6; offset <= 10; offset++) {
            LocalDate date = today.plusDays(offset);
            List<OpeningHour> ranges = week.stream().filter(h -> h.getDayOfWeek() == date.getDayOfWeek()).toList();
            if (ranges.isEmpty()) {
                continue;
            }
            // 2 à 4 RDV par jour, en évitant les chevauchements.
            int perDay = 2 + Math.floorMod(offset, 3);
            Instant previousEnd = Instant.MIN;
            for (LocalTime time : DEMO_TIMES) {
                if (perDay == 0) break;
                ServiceOffering service = offer.get(turn % offer.size());
                LocalTime end = time.plusMinutes(service.getDurationMinutes());
                boolean fits = ranges.stream().anyMatch(r -> !time.isBefore(r.getOpensAt()) && !end.isAfter(r.getClosesAt()));
                Instant start = date.atTime(time).atZone(business.zoneId()).toInstant();
                if (!fits || start.isBefore(previousEnd) || (offset == 0 && start.isBefore(now))) {
                    continue;
                }
                Appointment a = new Appointment(clients.get(turn % clients.size()), service, start,
                        start.plus(Duration.ofMinutes(service.getDurationMinutes())));
                if (start.isBefore(now)) {
                    a.changeStatusByShop(turn % 5 == 0 ? AppointmentStatus.NO_SHOW : AppointmentStatus.COMPLETED, now);
                }
                appointments.save(a);
                previousEnd = a.getEndAt();
                turn++;
                perDay--;
                count++;
            }
        }
        return count;
    }
}
