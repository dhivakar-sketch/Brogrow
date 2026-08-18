package com.sportstalent.backend.controller;

import com.sportstalent.backend.entity.Assessment;
import com.sportstalent.backend.entity.AthleteProfile;
import com.sportstalent.backend.entity.User;
import com.sportstalent.backend.repository.AssessmentRepository;
import com.sportstalent.backend.repository.AthleteProfileRepository;
import com.sportstalent.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coach")
public class CoachController {

    private final AthleteProfileRepository athleteProfileRepository;
    private final AssessmentRepository assessmentRepository;
    private final UserRepository userRepository;

    public CoachController(AthleteProfileRepository athleteProfileRepository,
                           AssessmentRepository assessmentRepository,
                           UserRepository userRepository) {
        this.athleteProfileRepository = athleteProfileRepository;
        this.assessmentRepository = assessmentRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/athletes")
    public ResponseEntity<?> getAthletesForReview(Authentication authentication) {
        if (!isCoachRole(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Coach access required"));
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (AthleteProfile profile : athleteProfileRepository.findAll()) {
            User user = profile.getUser();
            if (user == null) continue;

            List<Assessment> assessments = assessmentRepository.findByUserOrderByAssessedAtDesc(user);
            if (assessments.isEmpty()) continue;

            Assessment latest = assessments.get(0);
            Double latestScore = latest.getWeightedScore() != null
                    ? latest.getWeightedScore() : latest.getScore();

            String trend = "0.0%";
            if (assessments.size() > 1) {
                Double previousScore = assessments.get(1).getWeightedScore() != null
                        ? assessments.get(1).getWeightedScore() : assessments.get(1).getScore();
                if (previousScore != null && previousScore != 0 && latestScore != null) {
                    double change = ((latestScore - previousScore) / previousScore) * 100.0;
                    trend = String.format("%+.1f%%", change);
                }
            }

            Map<String, Object> athlete = new HashMap<>();
            athlete.put("id", profile.getId());
            athlete.put("name", profile.getAthleteName());
            athlete.put("sport", latest.getSport());
            athlete.put("score", latestScore);
            athlete.put("status", latest.isCoachVerified() ? "Coach verified" : "Pending review");
            athlete.put("trend", trend);
            athlete.put("assessmentId", latest.getId());
            athlete.put("assessedAt", latest.getAssessedAt());
            athlete.put("category", latest.getCategory());
            result.add(athlete);
        }

        result.sort(Comparator.comparing(
                item -> ((Number) item.get("score")).doubleValue(),
                Comparator.reverseOrder()));

        return ResponseEntity.ok(result);
    }

    @PostMapping("/assessments/{assessmentId}/verify")
    @Transactional
    public ResponseEntity<?> verifyAssessment(@PathVariable Long assessmentId,
                                               @RequestBody(required = false) Map<String, String> body,
                                               Authentication authentication) {
        if (!isCoachRole(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Coach access required"));
        }

        Assessment assessment = assessmentRepository.findById(assessmentId).orElse(null);
        if (assessment == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Assessment not found"));
        }

        boolean approved = body == null || !"false".equalsIgnoreCase(body.get("approved"));
        assessment.setCoachVerified(approved);

        if (body != null && body.get("comment") != null && !body.get("comment").isBlank()) {
            String existing = assessment.getNotes();
            String coachNote = "Coach review: " + body.get("comment").trim();
            assessment.setNotes(existing == null || existing.isBlank() ? coachNote : existing + "\n\n" + coachNote);
        }

        Assessment saved = assessmentRepository.save(assessment);
        return ResponseEntity.ok(Map.of(
                "assessmentId", saved.getId(),
                "coachVerified", saved.isCoachVerified(),
                "status", saved.isCoachVerified() ? "Coach verified" : "Needs re-assessment"
        ));
    }

    private boolean isCoachRole(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        return authentication.getAuthorities().stream().anyMatch(authority -> {
            String value = authority.getAuthority();
            return "ROLE_COACH".equals(value)
                    || "ROLE_ACADEMY".equals(value)
                    || "ROLE_ADMIN".equals(value)
                    || "COACH".equals(value)
                    || "ACADEMY".equals(value)
                    || "ADMIN".equals(value);
        });
    }
}
