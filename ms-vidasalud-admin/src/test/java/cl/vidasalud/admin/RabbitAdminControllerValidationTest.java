package cl.vidasalud.admin;

import cl.vidasalud.admin.controller.RabbitAdminController;
import cl.vidasalud.admin.dto.CreateExchangeDto;
import cl.vidasalud.admin.dto.CreateQueueDto;
import cl.vidasalud.admin.dto.QueueSummaryDto;
import cl.vidasalud.admin.service.MessageAuditStore;
import cl.vidasalud.admin.service.RabbitAdminService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RabbitAdminController.class)
class RabbitAdminControllerValidationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RabbitAdminService rabbitAdminService;

    @MockBean
    private MessageAuditStore auditStore;

    @Test
    void testCreateQueueWithBlankNameShouldFailValidation() throws Exception {
        CreateQueueDto request = new CreateQueueDto("", true, false, false);

        mockMvc.perform(post("/api/admin/queues")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validación de Parámetros Fallida"))
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    void testCreateQueueWithInvalidCharactersShouldFailValidation() throws Exception {
        CreateQueueDto request = new CreateQueueDto("queue with spaces!", true, false, false);

        mockMvc.perform(post("/api/admin/queues")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    void testCreateQueueValidSuccess() throws Exception {
        CreateQueueDto request = new CreateQueueDto("valid.queue.name", true, false, false);
        QueueSummaryDto summary = new QueueSummaryDto("valid.queue.name", true, false, false, 0, 0, false);

        when(rabbitAdminService.createQueue(any(CreateQueueDto.class))).thenReturn(summary);

        mockMvc.perform(post("/api/admin/queues")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("valid.queue.name"));
    }

    @Test
    void testCreateExchangeInvalidTypeShouldFailValidation() throws Exception {
        CreateExchangeDto request = new CreateExchangeDto("test.exchange", "invalid_type", true, false);

        mockMvc.perform(post("/api/admin/exchanges")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.type").exists());
    }
}
