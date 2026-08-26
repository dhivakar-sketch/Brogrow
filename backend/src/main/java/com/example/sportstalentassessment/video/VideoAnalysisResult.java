package com.example.sportstalentassessment.video;

import java.util.List;

public record VideoAnalysisResult(
        String jobId,
        String status,
        String sport,
        int frames,
        double fps,
        double poseDetectionRate,
        double averageLandmarkVisibility,
        List<VideoFinding> findings
) {
    public record VideoFinding(String title, String description, String suggestion, double confidence) {}
}
