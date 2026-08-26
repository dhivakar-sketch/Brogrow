package com.example.sportstalentassessment.video;

public record PoseMetrics(
        double leftKneeAngle,
        double rightKneeAngle,
        double leftElbowAngle,
        double rightElbowAngle,
        double shoulderTilt,
        double hipTilt
) {}
