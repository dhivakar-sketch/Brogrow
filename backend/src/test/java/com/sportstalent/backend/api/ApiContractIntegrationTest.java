package com.sportstalent.backend.api;

import static org.hamcrest.Matchers.containsString;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportstalent.backend.repository.AssessmentRepository;
import com.sportstalent.backend.repository.TalentInsightRepository;
import com.sportstalent.backend.repository.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiContractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private TalentInsightRepository talentInsightRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        assessmentRepository.deleteAll();
        talentInsightRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registerLoginAndAssessmentFlowWorks() throws Exception {
        String registerPayload = "{\"firstName\":\"Asha\",\"lastName\":\"Kumar\",\"email\":\"asha@example.com\",\"password\":\"StrongPass123!\",\"role\":\"ATHLETE\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("asha@example.com"));

        String loginPayload = "{\"email\":\"asha@example.com\",\"password\":\"StrongPass123!\"}";
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.role").value("ATHLETE"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode loginNode = objectMapper.readTree(loginResponse);
        String token = loginNode.get("token").asText();

        String assessmentPayload = "{\"sport\":\"Cricket\",\"category\":\"FITNESS\",\"score\":86.5,\"weightedScore\":88.2,\"notes\":\"Strong all-round progress\",\"benchmarkLabel\":\"U-17 benchmark\",\"benchmarkScore\":82.0,\"metrics\":{\"battingAverage\":62.0,\"strikeRate\":142.0,\"bowlingEconomy\":5.1,\"fieldingReflexScore\":89.0,\"sprintTime30m\":4.9,\"coordinationScore\":84.0}}";

        mockMvc.perform(post("/api/assessments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(assessmentPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sport").value("Cricket"));

        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallScore").exists());
    }

    @Test
    void sportSpecificTalentInsightIsGeneratedWithoutServerError() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Maya\",\"lastName\":\"Singh\",\"email\":\"maya@example.com\",\"password\":\"StrongPass123!\",\"role\":\"ATHLETE\"}"))
                .andExpect(status().isOk());

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"maya@example.com\",\"password\":\"StrongPass123!\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("token").asText();

        mockMvc.perform(post("/api/assessments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sport\":\"Football\",\"category\":\"PERFORMANCE\",\"score\":79.0,\"weightedScore\":81.1,\"notes\":\"Strong transition profile\",\"benchmarkLabel\":\"Regional benchmark\",\"benchmarkScore\":76.0,\"metrics\":{\"sprintTime40m\":5.8,\"yo2VO2Max\":52.0,\"passingAccuracy\":84.0,\"shotPowerScore\":76.0,\"agilityTTest\":10.8,\"ballControlScore\":80.0}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sport").value("Football"));

        mockMvc.perform(post("/api/talent-insights/Football")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sport").value("Football"))
                .andExpect(jsonPath("$.summary").exists())
                .andExpect(jsonPath("$.recommendations").exists());
    }

    @Test
    void invalidJwtReturns401JsonResponse() throws Exception {
        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer not-a-valid-jwt"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string(containsString("Invalid or expired JWT token")));
    }

    @Test
    void staleAuthorizationHeaderDoesNotBlockPublicRegisterEndpoint() throws Exception {
        String payload = "{\"firstName\":\"Ria\",\"lastName\":\"Patel\",\"email\":\"ria@example.com\",\"password\":\"StrongPass123!\",\"role\":\"ATHLETE\"}";

        mockMvc.perform(post("/api/auth/register")
                        .header("Authorization", "Bearer stale-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ria@example.com"));
    }

    @Test
    void duplicateRegistrationReturns409() throws Exception {
        String payload = "{\"firstName\":\"Ria\",\"lastName\":\"Patel\",\"email\":\"duplicate@example.com\",\"password\":\"StrongPass123!\",\"role\":\"ATHLETE\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void invalidAssessmentPayloadReturns400() throws Exception {
        String loginPayload = "{\"email\":\"valid@example.com\",\"password\":\"StrongPass123!\"}";
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Valid\",\"lastName\":\"User\",\"email\":\"valid@example.com\",\"password\":\"StrongPass123!\",\"role\":\"ATHLETE\"}"))
                .andExpect(status().isOk());

        String token = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode loginNode = objectMapper.readTree(token);
        String validToken = loginNode.get("token").asText();

        String invalidAssessment = "{\"sport\":\"\",\"category\":\"\",\"score\":null,\"weightedScore\":null}";

        mockMvc.perform(post("/api/assessments")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidAssessment))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }
}
