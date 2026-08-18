package com.sportstalent.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportstalent.backend.entity.SportDefinition;
import com.sportstalent.backend.repository.SportDefinitionRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SportCatalogService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final SportDefinitionRepository sportDefinitionRepository;

    public SportCatalogService(SportDefinitionRepository sportDefinitionRepository) {
        this.sportDefinitionRepository = sportDefinitionRepository;
    }

    public Map<String, Object> getSportMetricDefinitions(String sport) {
        String key = normalizeSlug(sport);
        List<Map<String, Object>> metrics = SportCatalogConfig.DEFAULT_SPORTS.stream()
                .filter(cfg -> key.equalsIgnoreCase((String) cfg.get("slug")))
                .findFirst()
                .map(cfg -> (List<Map<String, Object>>) cfg.get("metrics"))
                .orElse(List.of());

        Map<String, Object> result = new LinkedHashMap<>();
        for (Map<String, Object> metric : metrics) {
            String metricKey = String.valueOf(metric.get("key"));
            Map<String, Object> def = new LinkedHashMap<>();
            def.put("min", metric.getOrDefault("min", 0));
            def.put("max", metric.getOrDefault("max", 100));
            def.put("weight", metric.getOrDefault("weight", 1.0));
            def.put("lowerIsBetter", Boolean.TRUE.equals(metric.get("lowerIsBetter")));
            def.put("label", metric.getOrDefault("label", metricKey));
            result.put(metricKey, def);
        }
        return result;
    }

    public List<SportDefinition> getActiveSports() {
        return sportDefinitionRepository.findByActiveTrueOrderByNameAsc();
    }

    public Optional<SportDefinition> findBySlug(String slug) {
        return sportDefinitionRepository.findBySlugIgnoreCase(normalizeSlug(slug));
    }

    public SportDefinition getOrCreateDefaultSport(String slug) {
        String normalized = normalizeSlug(slug);
        return sportDefinitionRepository.findBySlugIgnoreCase(normalized)
                .orElseGet(() -> sportDefinitionRepository.save(SportDefinition.builder()
                        .slug(normalized)
                        .name(toDisplayName(normalized))
                        .description("Default sport configuration")
                        .assessmentCategories("[\"FITNESS\",\"SKILL\",\"PERFORMANCE\"]")
                        .skillCategories("[\"Speed\",\"Technical execution\"]")
                        .dashboardLabels("{\"overall\":\"Overall score\",\"trend\":\"Performance trend\"}")
                        .strengthSignals("[\"Consistent execution\"]")
                        .growthSignals("[\"Technical development\"]")
                        .recommendationTemplates("[\"Maintain the current training plan and reassess after 6 weeks.\"]")
                        .active(true)
                        .build()));
    }

    public List<String> getSportNames() {
        return getActiveSports().stream().map(SportDefinition::getName).toList();
    }

    public Map<String, Object> getSportDefinitionMap(String slug) {
        SportDefinition sport = findBySlug(slug)
                .orElseGet(() -> getOrCreateDefaultSport(slug));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("slug", sport.getSlug());
        result.put("name", sport.getName());
        result.put("description", sport.getDescription());
        result.put("assessmentCategories", readList(sport.getAssessmentCategories()));
        result.put("skillCategories", readList(sport.getSkillCategories()));
        result.put("dashboardLabels", readMap(sport.getDashboardLabels()));
        result.put("strengthSignals", readList(sport.getStrengthSignals()));
        result.put("growthSignals", readList(sport.getGrowthSignals()));
        result.put("recommendationTemplates", readList(sport.getRecommendationTemplates()));
        result.put("metrics", getSportMetricDefinitions(sport.getSlug()));
        return result;
    }

    public List<Map<String, Object>> listSportCatalog() {
        List<Map<String, Object>> output = new ArrayList<>();
        for (SportDefinition sport : getActiveSports()) {
            output.add(getSportDefinitionMap(sport.getSlug()));
        }
        if (output.isEmpty()) {
            for (Map<String, Object> sport : SportCatalogConfig.DEFAULT_SPORTS) {
                output.add(sport);
            }
        }
        return output;
    }

    public static String normalizeSlug(String value) {
        if (value == null || value.isBlank()) {
            return "unknown";
        }
        return value.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    private static String toDisplayName(String slug) {
        String[] parts = slug.split("-");
        StringBuilder builder = new StringBuilder();
        for (String part : parts) {
            if (part.isBlank()) continue;
            if (builder.length() > 0) builder.append(' ');
            builder.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return builder.length() > 0 ? builder.toString() : "Sport";
    }

    private static List<String> readList(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(raw, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of(raw);
        }
    }

    private static Map<String, Object> readMap(String raw) {
        if (raw == null || raw.isBlank()) {
            return Map.of();
        }
        try {
            return MAPPER.readValue(raw, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }
}
