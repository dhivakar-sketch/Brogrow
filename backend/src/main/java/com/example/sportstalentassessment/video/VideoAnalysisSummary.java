package com.example.sportstalentassessment.video;

import java.util.List;

public record VideoAnalysisSummary(
        int analyzedFrames,
        int poseDetectedFrames,
        double poseDetectionRate,
        PoseMetrics averageMetrics,
        List<VideoAnalysisResult.VideoFinding> findings
) {}
