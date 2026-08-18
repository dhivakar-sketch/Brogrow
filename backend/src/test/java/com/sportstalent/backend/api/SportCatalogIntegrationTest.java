package com.sportstalent.backend.api;

import com.sportstalent.backend.entity.SportDefinition;
import com.sportstalent.backend.repository.SportDefinitionRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SportCatalogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SportDefinitionRepository sportDefinitionRepository;

    @Test
    void sportCatalogReturnsConfiguredSports() throws Exception {
        if (sportDefinitionRepository.count() == 0) {
            sportDefinitionRepository.save(SportDefinition.builder()
                    .slug("cricket")
                    .name("Cricket")
                    .description("Batting, bowling, fielding and movement")
                    .assessmentCategories("[\"FITNESS\",\"SKILL\",\"PERFORMANCE\"]")
                    .skillCategories("[\"Batting\",\"Bowling\",\"Fielding\"]")
                    .dashboardLabels("{\"overall\":\"Overall score\",\"trend\":\"Performance trend\"}")
                    .strengthSignals("[\"Explosive acceleration\"]")
                    .growthSignals("[\"Footwork under pressure\"]")
                    .recommendationTemplates("[\"Continue technical repetition with live match pressure drills.\"]")
                    .active(true)
                    .build());
        }

        mockMvc.perform(get("/api/sports"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].metrics").exists())
                .andExpect(jsonPath("$[0].metrics.battingAverage.label").value("Batting Average"));
    }
}
