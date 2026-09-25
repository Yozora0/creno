package com.creno.offering;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.creno.AbstractIntegrationTest;
import com.creno.user.Role;

class ServiceOfferingControllerTest extends AbstractIntegrationTest {

    private long createAsAdmin(String adminToken, ServiceOfferingRequest request) throws Exception {
        String body = mockMvc.perform(post("/api/admin/services")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    @Test
    void admin_canCreateService_andItAppearsInPublicCatalog() throws Exception {
        String name = "Coupe " + UUID.randomUUID();
        createAsAdmin(bearer(Role.ADMIN), new ServiceOfferingRequest(name, "Test", 30, 2500, true));

        mockMvc.perform(get("/api/services"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem(name)));
    }

    @Test
    void inactiveService_isHiddenFromPublicCatalog_butVisibleToAdmin() throws Exception {
        String admin = bearer(Role.ADMIN);
        String name = "Inactive " + UUID.randomUUID();
        long id = createAsAdmin(admin, new ServiceOfferingRequest(name, null, 30, 2500, false));

        mockMvc.perform(get("/api/services"))
                .andExpect(jsonPath("$[*].name", not(hasItem(name))));
        mockMvc.perform(get("/api/services/" + id))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/admin/services").header("Authorization", admin))
                .andExpect(jsonPath("$[*].name", hasItem(name)));
    }

    @Test
    void admin_canUpdateAndDeleteService() throws Exception {
        String admin = bearer(Role.ADMIN);
        long id = createAsAdmin(admin, new ServiceOfferingRequest("À modifier", null, 30, 2500, true));

        mockMvc.perform(put("/api/admin/services/" + id)
                        .header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ServiceOfferingRequest("Modifiée", "Nouvelle description", 45, 3000, true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Modifiée"))
                .andExpect(jsonPath("$.durationMinutes").value(45));

        mockMvc.perform(delete("/api/admin/services/" + id).header("Authorization", admin))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/admin/services/" + id).header("Authorization", admin))
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidService_isRejected() throws Exception {
        mockMvc.perform(post("/api/admin/services")
                        .header("Authorization", bearer(Role.ADMIN))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ServiceOfferingRequest("", null, 2, -1, true))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.durationMinutes").exists())
                .andExpect(jsonPath("$.errors.priceCents").exists());
    }

    @Test
    void client_cannotManageServices() throws Exception {
        mockMvc.perform(post("/api/admin/services")
                        .header("Authorization", bearer(Role.CLIENT))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ServiceOfferingRequest("Pirate", null, 30, 0, true))))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymous_cannotManageServices() throws Exception {
        mockMvc.perform(post("/api/admin/services")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(new ServiceOfferingRequest("Pirate", null, 30, 0, true))))
                .andExpect(status().isUnauthorized());
    }
}
