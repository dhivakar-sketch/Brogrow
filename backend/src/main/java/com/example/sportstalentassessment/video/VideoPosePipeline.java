package com.example.sportstalentassessment.video;

import org.opencv.core.Point;

import java.util.Optional;

/**
 * Converts a detected pose into measurable metrics and technique findings.
 * The landmark detector is kept behind this boundary so the application can
 * use a real Java pose detector without coupling the controller to it.
 */
public class VideoPosePipeline {
    private final SportTechniqueRuleService rules;

    public VideoPosePipeline(SportTechniqueRuleService rules) {
        this.rules = rules;
    }

    public Optional<PoseAssessment> evaluate(String sport, PosePoints points) {
        if (points == null || !points.complete()) return Optional.empty();
        PoseMetrics metrics = PoseMetricCalculator.fromPoints(
                points.leftHip(), points.leftKnee(), points.leftAnkle(),
                points.rightHip(), points.rightKnee(), points.rightAnkle(),
                points.leftShoulder(), points.leftElbow(), points.leftWrist(),
                points.rightShoulder(), points.rightElbow(), points.rightWrist()
        );
        return Optional.of(new PoseAssessment(metrics, rules.evaluate(sport, metrics)));
    }

    public record PosePoints(
            Point leftHip, Point leftKnee, Point leftAnkle,
            Point rightHip, Point rightKnee, Point rightAnkle,
            Point leftShoulder, Point leftElbow, Point leftWrist,
            Point rightShoulder, Point rightElbow, Point rightWrist
    ) {
        public boolean complete() {
            return leftHip != null && leftKnee != null && leftAnkle != null
                    && rightHip != null && rightKnee != null && rightAnkle != null
                    && leftShoulder != null && leftElbow != null && leftWrist != null
                    && rightShoulder != null && rightElbow != null && rightWrist != null;
        }
    }

    public record PoseAssessment(
            PoseMetrics metrics,
            java.util.List<VideoAnalysisResult.VideoFinding> findings
    ) {}
}
