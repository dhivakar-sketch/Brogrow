package com.example.sportstalentassessment.video;

import org.opencv.core.Point;

import java.util.Optional;

/** Result returned by a real pose model adapter for one video frame. */
public record PoseDetectorResult(
        boolean detected,
        double confidence,
        VideoPosePipeline.PosePoints points
) {
    public Optional<VideoPosePipeline.PosePoints> validPoints() {
        return detected && points != null && points.complete() ? Optional.of(points) : Optional.empty();
    }

    public static PoseDetectorResult notDetected() {
        return new PoseDetectorResult(false, 0.0, null);
    }
}
