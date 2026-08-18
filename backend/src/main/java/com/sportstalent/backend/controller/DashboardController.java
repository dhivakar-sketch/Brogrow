package com.sportstalent.backend.controller;

import com.sportstalent.backend.entity.Assessment;
import com.sportstalent.backend.entity.TalentInsight;
import com.sportstalent.backend.repository.AssessmentRepository;
import com.sportstalent.backend.repository.TalentInsightRepository;
import com.sportstalent.backend.repository.UserRepository;
import com.sportstalent.backend.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dashboard controller that aggregates real data from the database.
 * Returns a rich summary for the currently authenticated user.
 */
@RestController
@RequestMapping("/api")
public class DashboardController {

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMM");

    private final UserRepository userRepository;
    private final AssessmentRepository assessmentRepository;
    private final TalentInsightRepository talentInsightRepository;

    public DashboardController(UserRepository userRepository,
                               AssessmentRepository assessmentRepository,
                               TalentInsightRepository talentInsightRepository) {
        this.userRepository = userRepository;
        this.assessmentRepository = assessmentRepository;
        this.talentInsightRepository = talentInsightRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("athleteName", user != null
                ? user.getFirstName() + " " + user.getLastName()
                : email);
        dashboard.put("decisionSupportNote",
                "This dashboard is decision-support only and must be reviewed with a qualified coach.");

        if (user == null) {
            dashboard.put("overallScore", 0.0);
            dashboard.put("trend", "No data");
            dashboard.put("totalAssessments", 0);
            return ResponseEntity.ok(dashboard);
        }

        List<Assessment> assessments = assessmentRepository.findByUserOrderByAssessedAtDesc(user);

        // Overall weighted score (average of all assessments)
        OptionalDouble avgOpt = assessments.stream()
                .mapToDouble(Assessment::getWeightedScore)
                .average();
        double overallScore = avgOpt.isPresent()
                ? Math.round(avgOpt.getAsDouble() * 10.0) / 10.0
                : 0.0;

        // Trend: compare the two most recent assessments
        String trend = "No trend data";
        if (assessments.size() >= 2) {
            double latest = assessments.get(0).getWeightedScore();
            double previous = assessments.get(1).getWeightedScore();
            double delta = latest - previous;
            trend = delta >= 0
                    ? String.format("+%.1f from last assessment", delta)
                    : String.format("%.1f from last assessment", delta);
        } else if (assessments.size() == 1) {
            trend = "First assessment recorded";
        }

        // Sports assessed
        List<String> sports = assessments.stream()
                .map(Assessment::getSport)
                .distinct()
                .collect(Collectors.toList());

        // Category breakdown
        Map<String, Double> categoryScores = assessments.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getCategory().name(),
                        Collectors.averagingDouble(Assessment::getWeightedScore)));

        // Top strengths: categories scoring >= 70
        List<String> strengths = categoryScores.entrySet().stream()
                .filter(e -> e.getValue() >= 70)
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .map(e -> capitalize(e.getKey().toLowerCase()) + " (" + String.format("%.0f", e.getValue()) + ")")
                .collect(Collectors.toList());

        // Growth areas: categories scoring < 70
        List<String> growthAreas = categoryScores.entrySet().stream()
                .filter(e -> e.getValue() < 70)
                .sorted(Map.Entry.comparingByValue())
                .map(e -> capitalize(e.getKey().toLowerCase()) + " (" + String.format("%.0f", e.getValue()) + ")")
                .collect(Collectors.toList());

        // Performance trend over time (last 6 assessments, reverse-chronological)
        List<Map<String, Object>> performanceTrend = new ArrayList<>();
        List<Assessment> last6 = assessments.subList(0, Math.min(6, assessments.size()));
        Collections.reverse(last6); // chronological order for chart
        for (Assessment a : last6) {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("label", a.getAssessedAt().format(MONTH_FMT));
            point.put("value", a.getWeightedScore());
            point.put("sport", a.getSport());
            performanceTrend.add(point);
        }

        // Coach verification status
        long verifiedCount = assessments.stream().filter(Assessment::isCoachVerified).count();
        String coachStatus = verifiedCount > 0
                ? verifiedCount + " assessment(s) coach-verified"
                : "Pending coach review";

        // Latest talent insights
        List<TalentInsight> insights = talentInsightRepository.findByUser(user);

        dashboard.put("overallScore", overallScore);
        dashboard.put("trend", trend);
        dashboard.put("totalAssessments", assessments.size());
        dashboard.put("sportsAssessed", sports);
        dashboard.put("categoryBreakdown", categoryScores);
        dashboard.put("strengths", strengths.isEmpty() ? List.of("Keep training to identify strengths") : strengths);
        dashboard.put("growthAreas", growthAreas.isEmpty() ? List.of("All categories performing well") : growthAreas);
        dashboard.put("performanceTrend", performanceTrend);
        dashboard.put("coachVerificationStatus", coachStatus);
        dashboard.put("latestInsights", insights.stream()
                .limit(3)
                .map(i -> Map.of(
                        "sport", i.getSport(),
                        "score", i.getOverallScore(),
                        "summary", i.getSummary()))
                .collect(Collectors.toList()));

        return ResponseEntity.ok(dashboard);
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
