package com.example.sporttalentassessment.video;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class SportTechniqueRuleService {
    private static final double KNEE_ASYMMETRY_THRESHOLD = 20.0;
    private static final double ARM_ASYMMETRY_THRESHOLD = 25.0;

    public List<VideoAnalysisResult.VideoFinding> evaluate(String sport, PoseMetrics metrics) {
        List<VideoAnalysisResult.VideoFinding> findings = new ArrayList<>();
        if (metrics == null) return findings;

        // These are general pose observations, not sport-specific diagnoses.
        // Evaluate each pair independently so a missing knee measurement does
        // not hide a valid arm observation (and vice versa).
        if (isJointAngle(metrics.leftKneeAngle()) && isJointAngle(metrics.rightKneeAngle())) {
            double difference = Math.abs(metrics.leftKneeAngle() - metrics.rightKneeAngle());
            if (difference > KNEE_ASYMMETRY_THRESHOLD) {
                findings.add(new VideoAnalysisResult.VideoFinding(
                        "Knee-angle asymmetry",
                        String.format(Locale.ROOT, "Left/right knee angle differs by %.1f degrees.", difference),
                        "Review the movement frame-by-frame and work on balanced lower-body positioning.",
                        0.70
                ));
            }
        }

        if (isJointAngle(metrics.leftElbowAngle()) && isJointAngle(metrics.rightElbowAngle())) {
            double difference = Math.abs(metrics.leftElbowAngle() - metrics.rightElbowAngle());
            if (difference > ARM_ASYMMETRY_THRESHOLD) {
                findings.add(new VideoAnalysisResult.VideoFinding(
                        "Arm-angle asymmetry",
                        String.format(Locale.ROOT, "Left/right elbow angle differs by %.1f degrees.", difference),
                        "Review arm positioning and repeat the movement with controlled symmetry.",
                        0.65
                ));
            }
        }

        return findings;
    }

    private boolean isJointAngle(double angle) {
        return Double.isFinite(angle) && angle >= 0.0 && angle <= 180.0;
    }
}
