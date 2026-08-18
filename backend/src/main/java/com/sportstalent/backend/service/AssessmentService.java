package com.sportstalent.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportstalent.backend.dto.AssessmentRequest;
import com.sportstalent.backend.entity.Assessment;
import com.sportstalent.backend.entity.AssessmentCategory;
import com.sportstalent.backend.entity.TalentInsight;
import com.sportstalent.backend.entity.User;
import com.sportstalent.backend.repository.AssessmentRepository;
import com.sportstalent.backend.repository.TalentInsightRepository;
import com.sportstalent.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Assessment service with a dynamic scoring engine.
 * Raw athlete metrics are normalized against sport-specific benchmarks,
 * weighted by category, and aggregated into a talent tier classification.
 *
 * <p>This is a decision-support tool. All assessments must be reviewed by a
 * qualified coach before being used to make talent identification decisions.</p>
 */
@Service
public class AssessmentService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final Map<String, Map<String, double[]>> SPORT_METRICS = buildSportMetrics();

    private static Map<String, Map<String, double[]>> buildSportMetrics() {
        Map<String, Map<String, double[]>> map = new HashMap<>();
        for (Map<String, Object> sport : SportCatalogConfig.DEFAULT_SPORTS) {
            Map<String, double[]> defs = new LinkedHashMap<>();
            List<Map<String, Object>> metrics = (List<Map<String, Object>>) sport.get("metrics");
            for (Map<String, Object> metric : metrics) {
                String key = String.valueOf(metric.get("key"));
                defs.put(key, new double[]{
                        ((Number) metric.get("min")).doubleValue(),
                        ((Number) metric.get("max")).doubleValue(),
                        ((Number) metric.get("weight")).doubleValue(),
                        Boolean.TRUE.equals(metric.get("lowerIsBetter")) ? 1 : 0
                });
            }
            map.put(String.valueOf(sport.get("slug")), defs);
        }
        return map;
    }

    private final AssessmentRepository assessmentRepository;
    private final TalentInsightRepository talentInsightRepository;
    private final UserRepository userRepository;
    private final SportCatalogService sportCatalogService;

    public AssessmentService(AssessmentRepository assessmentRepository,
                             TalentInsightRepository talentInsightRepository,
                             UserRepository userRepository,
                             SportCatalogService sportCatalogService) {
        this.assessmentRepository = assessmentRepository;
        this.talentInsightRepository = talentInsightRepository;
        this.userRepository = userRepository;
        this.sportCatalogService = sportCatalogService;
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    @Transactional
    public Assessment createAssessment(String email, AssessmentRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Compute scores from raw metrics when provided
        double computedScore = request.getScore() != null ? request.getScore() : 0.0;
        double computedWeightedScore = request.getWeightedScore() != null ? request.getWeightedScore() : 0.0;
        String metricsJson = null;

        if (request.getMetrics() != null && !request.getMetrics().isEmpty()) {
            ScoringResult result = computeScore(request.getSport(), request.getMetrics());
            computedScore = result.normalizedScore;
            computedWeightedScore = result.weightedScore;
            try {
                metricsJson = MAPPER.writeValueAsString(request.getMetrics());
            } catch (JsonProcessingException e) {
                log.warn("Could not serialize metrics to JSON: {}", e.getMessage());
            }
        }

        Assessment assessment = Assessment.builder()
                .user(user)
                .sport(request.getSport())
                .category(AssessmentCategory.valueOf(request.getCategory().toUpperCase()))
                .score(computedScore)
                .weightedScore(computedWeightedScore)
                .notes(request.getNotes())
                .benchmarkLabel(request.getBenchmarkLabel())
                .benchmarkScore(request.getBenchmarkScore())
                .metricsJson(metricsJson)
                .build();

        return assessmentRepository.save(assessment);
    }

    public List<Assessment> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return assessmentRepository.findByUserOrderByAssessedAtDesc(user);
    }

    @Transactional
    public TalentInsight generateTalentInsight(String email, String sport) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Assessment> assessments = assessmentRepository.findByUserAndSportOrderByAssessedAtDesc(user, sport);
        if (assessments.isEmpty()) {
            throw new IllegalArgumentException("No assessments found for sport: " + sport);
        }

        double overallScore = assessments.stream()
                .mapToDouble(Assessment::getWeightedScore)
                .average()
                .orElse(0.0);

        // Score trend: compare most recent vs oldest
        double trend = 0.0;
        if (assessments.size() >= 2) {
            double newest = assessments.get(0).getWeightedScore();
            double oldest = assessments.get(assessments.size() - 1).getWeightedScore();
            trend = newest - oldest;
        }

        String talentTier = classifyTalentTier(overallScore);
        String summary = buildSummary(sport, overallScore, trend, talentTier);
        String recommendations = buildRecommendations(sport, overallScore, assessments);
        String caution = "This assessment is a decision-support tool only. Results must be reviewed "
                + "alongside a qualified coach evaluation before being used for talent selection or "
                + "training programme decisions.";

        TalentInsight insight = TalentInsight.builder()
                .user(user)
                .sport(sport)
                .overallScore(Math.round(overallScore * 10.0) / 10.0)
                .summary(summary)
                .recommendations(recommendations)
                .caution(caution)
                .build();

        return talentInsightRepository.save(insight);
    }

    public List<TalentInsight> getTalentInsights(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return talentInsightRepository.findByUser(user);
    }

    /**
     * Returns the supported metric definitions for a given sport so the
     * frontend can dynamically render the correct input fields.
     */
    public Map<String, Object> getSportMetricDefinitions(String sport) {
        return sportCatalogService.getSportMetricDefinitions(sport);
    }

    // -----------------------------------------------------------------------
    // Scoring engine (package-visible for unit tests)
    // -----------------------------------------------------------------------

    ScoringResult computeScore(String sport, Map<String, Double> rawMetrics) {
        String key = sport.toLowerCase();
        Map<String, double[]> config = SPORT_METRICS.getOrDefault(key, Map.of());

        if (config.isEmpty()) {
            // Generic fallback: average of all supplied values, capped to 0–100
            double avg = rawMetrics.values().stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
            double capped = Math.min(100, Math.max(0, avg));
            return new ScoringResult(capped, capped);
        }

        double weightedSum = 0.0;
        double totalWeight = 0.0;
        double unweightedSum = 0.0;
        int metricCount = 0;

        for (Map.Entry<String, double[]> entry : config.entrySet()) {
            String metricName = entry.getKey();
            double[] cfg = entry.getValue();
            double min = cfg[0];
            double max = cfg[1];
            double weight = cfg[2];
            boolean lowerIsBetter = cfg[3] == 1.0;

            Double raw = rawMetrics.get(metricName);
            if (raw == null) continue;

            // Clamp to benchmark range
            double clamped = Math.min(max, Math.max(min, raw));
            // Normalize to 0–100
            double normalized = (clamped - min) / (max - min) * 100.0;
            if (lowerIsBetter) {
                normalized = 100.0 - normalized;
            }

            weightedSum += normalized * weight;
            totalWeight += weight;
            unweightedSum += normalized;
            metricCount++;
        }

        double weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0.0;
        double normalizedScore = metricCount > 0 ? unweightedSum / metricCount : 0.0;

        // Round to 1 decimal place
        weightedScore = Math.round(weightedScore * 10.0) / 10.0;
        normalizedScore = Math.round(normalizedScore * 10.0) / 10.0;

        return new ScoringResult(normalizedScore, weightedScore);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private String classifyTalentTier(double score) {
        if (score >= 85) return "Elite";
        if (score >= 70) return "High Potential";
        if (score >= 55) return "Developing";
        if (score >= 40) return "Foundation";
        return "Needs Development";
    }

    private String buildSummary(String sport, double score, double trend, String tier) {
        String trendStr = trend > 0
                ? String.format("+%.1f points improvement across assessments", trend)
                : trend < 0
                        ? String.format("%.1f points decline — targeted intervention recommended", trend)
                        : "performance is stable across assessments";

        return String.format(
                "Talent classification: %s. Overall assessment score: %.1f/100 for %s. "
                + "Trend: %s. This evaluation reflects objective metric analysis and should be "
                + "interpreted in the context of age, training history, and coach observations.",
                tier, score, sport, trendStr);
    }

    private String buildRecommendations(String sport, double score, List<Assessment> assessments) {
        List<String> recs = new ArrayList<>();
        List<?> choices = SportCatalogConfig.DEFAULT_SPORTS.stream()
                .filter(cfg -> String.valueOf(cfg.get("slug")).equalsIgnoreCase(sport.trim().toLowerCase()))
                .findFirst()
                .map(cfg -> (List<?>) cfg.get("recommendationTemplates"))
                .orElse(List.of());

        if (choices.isEmpty()) {
            recs.add("Maintain current training programme and re-test in 6–8 weeks.");
        } else {
            for (Object item : choices) {
                recs.add(String.valueOf(item));
            }
        }

        if (score < 70) {
            recs.add("Prioritise the lower-performing components identified in this assessment and re-test after the next training block.");
        }

        return String.join(" ", recs);
    }

    // -----------------------------------------------------------------------
    // Inner value type
    // -----------------------------------------------------------------------

    record ScoringResult(double normalizedScore, double weightedScore) {}
}
