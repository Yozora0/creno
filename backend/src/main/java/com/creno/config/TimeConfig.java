package com.creno.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TimeConfig {

    /** Horloge injectée plutôt que LocalDate.now() : les tests peuvent la figer. */
    @Bean
    Clock clock(BusinessProperties props) {
        return Clock.system(props.zoneId());
    }
}
