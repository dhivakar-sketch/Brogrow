package com.sportstalent.backend.controller;

import com.sportstalent.backend.dto.AssessmentRequest;
import com.sportstalent.backend.entity.Assessment;
import com.sportstalent.backend.entity.TalentInsight;
import com.sportstalent.backend.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping("/assessments")
    public ResponseEntity<Assessment> saveAssessment(Authentication authentication,
                                                     @Valid @RequestBody AssessmentRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(assessmentService.createAssessment(email, request));
    }

    @GetMapping("/assessments")
    public ResponseEntity<List<Assessment>> getAssessmentHistory(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(assessmentService.getHistory(email));
    }

    @GetMapping("/talent-insights")
    public ResponseEntity<List<TalentInsight>> getTalentInsights(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(assessmentService.getTalentInsights(email));
    }

    @PostMapping("/talent-insights/{sport}")
    public ResponseEntity<TalentInsight> generateTalentInsight(Authentication authentication,
                                                               @PathVariable String sport) {
        String email = authentication.getName();
        return ResponseEntity.ok(assessmentService.generateTalentInsight(email, sport));
    }

    /**
     * Returns the metric definitions for a given sport.
     * Used by the frontend to dynamically render assessment input fields.
     * Public endpoint — no auth required so the UI can fetch before login.
     */
    @GetMapping("/sports/{sport}/metrics")
    public ResponseEntity<Map<String, Object>> getSportMetrics(@PathVariable String sport) {
        return ResponseEntity.ok(assessmentService.getSportMetricDefinitions(sport));
    }
}
