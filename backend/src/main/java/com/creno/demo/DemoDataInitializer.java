package com.creno.demo;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.creno.offering.ServiceOffering;
import com.creno.offering.ServiceOfferingRepository;
import com.creno.schedule.OpeningHour;
import com.creno.schedule.OpeningHourRepository;
import com.creno.user.Role;
import com.creno.user.User;
import com.creno.user.UserRepository;

/**
 * Jeu de données de démonstration (profil "demo") : un salon de coiffure fictif,
 * un compte commerçant et un compte client prêts à l'emploi pour les recruteurs.
 * Idempotent : ne fait rien si la base contient déjà des utilisateurs.
 */
@Component
@Profile("demo")
public class DemoDataInitializer implements ApplicationRunner {

    public static final String ADMIN_EMAIL = "admin@creno.dev";
    public static final String CLIENT_EMAIL = "client@creno.dev";

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final UserRepository users;
    private final ServiceOfferingRepository services;
    private final OpeningHourRepository openingHours;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(UserRepository users, ServiceOfferingRepository services,
                               OpeningHourRepository openingHours, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.services = services;
        this.openingHours = openingHours;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }

        users.save(new User(ADMIN_EMAIL, passwordEncoder.encode("Admin123!"),
                "Camille", "Martin", "02 54 00 00 00", Role.ADMIN));
        users.save(new User(CLIENT_EMAIL, passwordEncoder.encode("Client123!"),
                "Léa", "Durand", "06 00 00 00 00", Role.CLIENT));

        services.saveAll(List.of(
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

        log.info("Données de démo créées : {} / Admin123! et {} / Client123!", ADMIN_EMAIL, CLIENT_EMAIL);
    }
}
