package com.example.sportstalentassessment.video;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class SportTechniqueRuleService {
    public List<VideoAnalysisResult.VideoFinding> evaluate(String sport, PoseMetrics metrics) {
        List<VideoAnalysisResult.VideoFinding> findings = new ArrayList<>();
        String normalized = sport == null ? "" : sport.toLowerCase(Locale.ROOT);

        if (metrics.leftKneeAngle() < 0 || metrics.rightKneeAngle() < 0) {
            return findings;
        }

        // Generic movement-quality checks. These are deliberately conservative:
        // they only report measurable asymmetry and do not claim a sport fault
        // without a sport-specific validated threshold.
        double kneeDifference = Math.abs(metrics.leftKneeAngle() - metrics.rightKneeAngle());
        if (kneeDifference > 20.0) {
            findings.add(new VideoAnalysisResult.VideoFinding(
                    "Knee-angle asymmetry",
                    String.format(Locale.ROOT, "Left/right knee angle differs by %.1f degrees.", kneeDifference),
                    "Review the movement frame-by-frame and work on balanced lower-body positioning.",
                    0.70
            ));
        }

        double elbowDifference = Math.abs(metrics.leftElbowAngle() - metrics.rightElbowAngle());
        if (elbowDifference > 25.0) {
            findings.add(new VideoAnalysisResult.VideoFinding(
                    "Arm-angle asymmetry",
                    String.format(Locale.ROOT, "Left/right elbow angle differs by %.1f degrees.", elbowDifference),
                    "Review arm positioning and repeat the movement with controlled symmetry.",
                    0.65
            ));
        }

        // Keep sport available for the next validated rule set without
        // pretending that generic pose metrics are a complete sports assessment.
        if (normalized.isBlank()) {
            return findings;
        }
        return findings;
    }
}
