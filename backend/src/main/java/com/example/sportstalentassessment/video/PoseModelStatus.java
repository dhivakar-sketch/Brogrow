package com.example.sportstalentassessment.video;

public record PoseModelStatus(
        boolean configured,
        String provider,
        String message
) {}
