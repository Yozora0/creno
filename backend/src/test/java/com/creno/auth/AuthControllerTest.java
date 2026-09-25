package com.creno.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.creno.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;

class AuthControllerTest extends AbstractIntegrationTest {

    private RegisterRequest registerRequest(String email) {
        return new RegisterRequest(email, "Password123!", "Léa", "Durand", "06 12 34 56 78");
    }

    @Test
    void register_createsClientAndReturnsUsableToken() throws Exception {
        String email = uniqueEmail("lea");

        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(registerRequest(email))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.role").value("CLIENT"))
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(body).get("token").asText();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void register_normalizesEmailAndRejectsDuplicates() throws Exception {
        String email = uniqueEmail("dup");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(registerRequest(email))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(registerRequest("  " + email.toUpperCase() + " "))))
                .andExpect(status().isConflict());
    }

    @Test
    void register_withInvalidData_returnsFieldErrors() throws Exception {
        RegisterRequest invalid = new RegisterRequest("pas-un-email", "court", "", "Durand", null);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists())
                .andExpect(jsonPath("$.errors.firstName").exists());
    }

    @Test
    void login_withGoodAndBadPassword() throws Exception {
        String email = uniqueEmail("login");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(registerRequest(email))))
                .andExpect(status().isCreated());

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new LoginRequest(email, "Password123!"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode response = objectMapper.readTree(body);
        assertThat(response.get("token").asText()).isNotBlank();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new LoginRequest(email, "mauvais-mot-de-passe"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_withoutToken_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }
}
