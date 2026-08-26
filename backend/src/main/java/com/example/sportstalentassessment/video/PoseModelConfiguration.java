package com.example.sportstalentassessment.video;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "sports.pose-model")
public record PoseModelConfiguration(
        boolean enabled,
        String provider,
        String modelPath,
        double minConfidence
) {
    public PoseModelConfiguration {
        provider = provider == null ? "none" : provider;
        modelPath = modelPath == null ? "" : modelPath;
        if (minConfidence < 0 || minConfidence > 1) {
            throw new IllegalArgumentException("sports.pose-model.min-confidence must be between 0 and 1");
        }
    }
}
