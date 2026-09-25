package com.creno.schedule;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Informations publiques : horaires et fermetures à venir (affichées sur la page d'accueil). */
@RestController
@RequestMapping("/api")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping("/opening-hours")
    public List<OpeningHourDto> openingHours() {
        return scheduleService.getWeek();
    }

    @GetMapping("/closures")
    public List<ClosureResponse> closures() {
        return scheduleService.upcomingClosures();
    }
}
