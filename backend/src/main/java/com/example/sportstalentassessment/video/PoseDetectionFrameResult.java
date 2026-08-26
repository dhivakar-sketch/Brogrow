package com.example.sportstalentassessment.video;

/** Immutable frame-level result used by the video analysis pipeline. */
public record PoseDetectionFrameResult(
        long frameIndex,
        double timestampSeconds,
        boolean detected,
        double confidence,
        PoseMetrics metrics
) {
    public static PoseDetectionFrameResult notDetected(long frameIndex, double timestampSeconds) {
        return new PoseDetectionFrameResult(frameIndex, timestampSeconds, false, 0.0, null);
    }
}
