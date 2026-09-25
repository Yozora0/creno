package com.creno.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.creno.AbstractIntegrationTest;
import com.creno.user.Role;

/**
 * Tentatives d'injection classiques : elles doivent être refusées proprement (400/401),
 * jamais provoquer d'erreur serveur (500) ni altérer la base.
 */
class InputSecurityTest extends AbstractIntegrationTest {

    private ResultActions register(String firstName, String lastName, String email) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                        "email", email,
                        "password", "Password123!",
                        "firstName", firstName,
                        "lastName", lastName))));
    }

    @Test
    void scriptTagInName_isRejected() throws Exception {
        register("<script>alert(1)</script>", "Durand", uniqueEmail("xss"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").exists());
    }

    @Test
    void sqlInjectionInName_isRejected_andUsersTableIsIntact() throws Exception {
        long before = userRepository.count();

        register("Robert", "'); DROP TABLE users;--", uniqueEmail("sql"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.lastName").exists());

        assertThat(userRepository.count()).isEqualTo(before);
    }

    @Test
    void legitimateNamesWithAccentsApostrophesAndHyphens_areAccepted() throws Exception {
        register("Jean-Éloïse", "O'Neil", uniqueEmail("ok"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.firstName").value("Jean-Éloïse"))
                .andExpect(jsonPath("$.user.lastName").value("O'Neil"));
    }

    @Test
    void sqlInjectionInLoginEmail_isRejectedCleanly() throws Exception {
        // Format invalide : refusé par la validation
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "' OR '1'='1", "password", "x"))))
                .andExpect(status().isBadRequest());

        // Format valide contenant une apostrophe : la requête paramétrée cherche littéralement
        // cette adresse, ne trouve rien, et répond 401 (et non 500 ni une connexion réussie).
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "o'hara@test.dev", "password", "' OR '1'='1"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void lineBreaksInServiceName_areRejected() throws Exception {
        mockMvc.perform(post("/api/admin/services")
                        .header("Authorization", bearer(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Coupe\r\nBcc: victime@exemple.fr", "durationMinutes", 30, "priceCents", 1000))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void htmlInDescription_isStoredAsPlainText() throws Exception {
        // Pas de refus : c'est du texte. Il est renvoyé tel quel et React l'affichera échappé.
        String body = mockMvc.perform(post("/api/admin/services")
                        .header("Authorization", bearer(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("name", "Soin", "description", "<b>Nouveau</b> & doux",
                                "durationMinutes", 30, "priceCents", 1000))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = objectMapper.readTree(body).get("id").asLong();

        mockMvc.perform(get("/api/services/" + id))
                .andExpect(jsonPath("$.description").value("<b>Nouveau</b> & doux"));
    }
}
