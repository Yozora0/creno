package com.creno.config;

import java.time.ZoneId;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Paramètres du commerce. Le fuseau sert à interpréter les horaires d'ouverture ("9h" = 9h à Paris). */
@ConfigurationProperties(prefix = "creno.business")
public record BusinessProperties(ZoneId zoneId) {

    public BusinessProperties {
        if (zoneId == null) {
            zoneId = ZoneId.of("Europe/Paris");
        }
    }
}
