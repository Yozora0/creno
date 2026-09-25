package com.creno.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Active @Async (envoi des emails en arrière-plan, via l'exécuteur configuré par Spring Boot). */
@Configuration
@EnableAsync
public class AsyncConfig {
}
