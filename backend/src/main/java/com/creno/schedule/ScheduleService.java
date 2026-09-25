package com.creno.schedule;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.creno.common.BusinessRuleException;
import com.creno.common.NotFoundException;

@Service
public class ScheduleService {

    private static final Comparator<OpeningHourDto> WEEK_ORDER =
            Comparator.comparing(OpeningHourDto::dayOfWeek).thenComparing(OpeningHourDto::opensAt);

    private final OpeningHourRepository openingHours;
    private final ClosureRepository closures;
    private final Clock clock;

    public ScheduleService(OpeningHourRepository openingHours, ClosureRepository closures, Clock clock) {
        this.openingHours = openingHours;
        this.closures = closures;
        this.clock = clock;
    }

    // ---------- Horaires d'ouverture ----------

    @Transactional(readOnly = true)
    public List<OpeningHourDto> getWeek() {
        return openingHours.findAllByOrderByOpensAtAsc().stream()
                .map(OpeningHourDto::from)
                .sorted(WEEK_ORDER)
                .toList();
    }

    @Transactional
    public List<OpeningHourDto> replaceWeek(WeeklyScheduleRequest request) {
        OpeningHoursValidator.validate(request.slots());
        openingHours.deleteAllInBatch();
        openingHours.saveAll(request.slots().stream()
                .map(s -> new OpeningHour(s.dayOfWeek(), s.opensAt(), s.closesAt()))
                .toList());
        return request.slots().stream().sorted(WEEK_ORDER).toList();
    }

    // ---------- Fermetures exceptionnelles ----------

    @Transactional(readOnly = true)
    public List<ClosureResponse> upcomingClosures() {
        return closures.findAllByEndDateGreaterThanEqualOrderByStartDateAsc(LocalDate.now(clock)).stream()
                .map(ClosureResponse::from)
                .toList();
    }

    @Transactional
    public ClosureResponse addClosure(ClosureRequest request) {
        if (request.endDate().isBefore(LocalDate.now(clock))) {
            throw new BusinessRuleException("Impossible d'ajouter une fermeture entièrement passée.");
        }
        String reason = StringUtils.hasText(request.reason()) ? request.reason().trim() : null;
        Closure saved = closures.save(new Closure(request.startDate(), request.endDate(), reason));
        return ClosureResponse.from(saved);
    }

    @Transactional
    public void deleteClosure(Long id) {
        Closure closure = closures.findById(id).orElseThrow(() -> NotFoundException.of("Fermeture", id));
        closures.delete(closure);
    }
}
