package com.creno.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param from        expéditeur, ex. "Salon Camille &lt;no-reply@creno.dev&gt;"
 * @param shopName    signature des emails
 * @param frontendUrl URL publique du front, pour les liens dans les emails
 */
@ConfigurationProperties(prefix = "creno.mail")
public record MailProperties(String from, String shopName, String frontendUrl) {

    public MailProperties {
        if (from == null) from = "no-reply@creno.dev";
        if (shopName == null) shopName = "Créno";
        if (frontendUrl == null) frontendUrl = "http://localhost:5173";
    }
}
