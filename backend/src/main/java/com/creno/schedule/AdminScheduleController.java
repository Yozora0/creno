package com.creno.schedule;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
public class AdminScheduleController {

    private final ScheduleService scheduleService;

    public AdminScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PutMapping("/opening-hours")
    public List<OpeningHourDto> replaceWeek(@Valid @RequestBody WeeklyScheduleRequest request) {
        return scheduleService.replaceWeek(request);
    }

    @PostMapping("/closures")
    @ResponseStatus(HttpStatus.CREATED)
    public ClosureResponse addClosure(@Valid @RequestBody ClosureRequest request) {
        return scheduleService.addClosure(request);
    }

    @DeleteMapping("/closures/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClosure(@PathVariable Long id) {
        scheduleService.deleteClosure(id);
    }
}
