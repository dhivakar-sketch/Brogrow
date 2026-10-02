package com.sportstalent.backend.api;

import com.example.sportstalentassessment.video.PoseMetrics;
import com.example.sportstalentassessment.video.SportTechniqueRuleService;
import com.example.sportstalentassessment.video.VideoPosePipeline;
import org.junit.jupiter.api.Test;
import org.opencv.core.Point;

import static org.junit.jupiter.api.Assertions.*;

class VideoPosePipelineTest {
    private final SportTechniqueRuleService rules = new SportTechniqueRuleService();
    private final VideoPosePipeline pipeline = new VideoPosePipeline(rules);

    @Test
    void calculatesJointAnglesAndReturnsAssessmentForCompletePose() {
        var points = new VideoPosePipeline.PosePoints(
                new Point(0, 0), new Point(0, 1), new Point(1, 1),
                new Point(2, 0), new Point(2, 1), new Point(3, 1),
                new Point(0, 0), new Point(0, 1), new Point(1, 1),
                new Point(2, 0), new Point(2, 1), new Point(3, 1));

        var assessment = pipeline.evaluate("Cricket", points);

        assertTrue(assessment.isPresent());
        assertEquals(90.0, assessment.get().metrics().leftKneeAngle(), 0.001);
        assertEquals(90.0, assessment.get().metrics().rightKneeAngle(), 0.001);
        assertEquals(90.0, assessment.get().metrics().leftElbowAngle(), 0.001);
        assertTrue(assessment.get().findings().isEmpty());
    }

    @Test
    void rejectsIncompletePoseInsteadOfInventingMetrics() {
        var points = new VideoPosePipeline.PosePoints(
                null, new Point(0, 1), new Point(1, 1),
                new Point(2, 0), new Point(2, 1), new Point(3, 1),
                new Point(0, 0), new Point(0, 1), new Point(1, 1),
                new Point(2, 0), new Point(2, 1), new Point(3, 1));

        assertTrue(pipeline.evaluate("Football", points).isEmpty());
    }

    @Test
    void reportsMeasuredKneeAsymmetryWithoutSportFaultClaim() {
        var metrics = new PoseMetrics(120, 90, 150, 150, 0, 0);

        var findings = rules.evaluate("Football", metrics);

        assertEquals(1, findings.size());
        assertEquals("Knee-angle asymmetry", findings.get(0).title());
        assertTrue(findings.get(0).description().contains("30.0 degrees"));
        assertTrue(findings.get(0).suggestion().contains("Review"));
    }

    @Test
    void reportsArmAsymmetryWhenMeasuredDifferenceExceedsThreshold() {
        var metrics = new PoseMetrics(100, 100, 160, 120, 0, 0);

        var findings = rules.evaluate("Cricket", metrics);

        assertTrue(findings.stream().anyMatch(f -> f.title().equals("Arm-angle asymmetry")));
    }
}
