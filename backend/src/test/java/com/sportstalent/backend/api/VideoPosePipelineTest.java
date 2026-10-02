package com.sportstalent.backend.api;

import com.example.sportstalentassessment.video.PoseMetrics;
import com.example.sportstalentassessment.video.MovementPhaseSegmenter;
import java.util.List;
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

    @Test
    void keepsArmFindingWhenKneeMeasurementsAreMissing() {
        var metrics = new PoseMetrics(-1, -1, 170, 120, 0, 0);

        var findings = rules.evaluate("Cricket", metrics);

        assertEquals(1, findings.size());
        assertEquals("Arm-angle asymmetry", findings.get(0).title());
    }

    @Test
    void ignoresNonFiniteAndOutOfRangeJointAngles() {
        var metrics = new PoseMetrics(Double.NaN, 220, 190, 20, 0, 0);

        assertTrue(rules.evaluate("Football", metrics).isEmpty());
    }
    @Test
    void segmentsLowMotionSetupActiveActionAndRecovery() {
        var samples = List.of(
                new MovementPhaseSegmenter.Sample(0.0, 0.01),
                new MovementPhaseSegmenter.Sample(0.5, 0.02),
                new MovementPhaseSegmenter.Sample(1.0, 0.30),
                new MovementPhaseSegmenter.Sample(1.5, 0.42),
                new MovementPhaseSegmenter.Sample(2.0, 0.03),
                new MovementPhaseSegmenter.Sample(2.5, 0.01));

        var segments = MovementPhaseSegmenter.segment(samples, 0.10);

        assertEquals(List.of(MovementPhaseSegmenter.Phase.SETUP,
                MovementPhaseSegmenter.Phase.ACTION,
                MovementPhaseSegmenter.Phase.RECOVERY),
                segments.stream().map(MovementPhaseSegmenter.Segment::phase).toList());
        assertEquals(1.0, segments.get(1).startSeconds(), 0.001);
        assertEquals(1.5, segments.get(1).endSeconds(), 0.001);
    }

    @Test
    void returnsNoSegmentsForInsufficientOrInvalidSamples() {
        assertTrue(MovementPhaseSegmenter.segment(List.of(), 0.1).isEmpty());
        assertTrue(MovementPhaseSegmenter.segment(List.of(
                new MovementPhaseSegmenter.Sample(Double.NaN, 0.2),
                new MovementPhaseSegmenter.Sample(1, 0.3),
                new MovementPhaseSegmenter.Sample(2, 0.4)), 0.1).isEmpty());
    }

}
