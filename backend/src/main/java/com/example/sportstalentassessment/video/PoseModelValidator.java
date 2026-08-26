package com.example.sportstalentassessment.video;

import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class PoseModelValidator {
    public PoseModelStatus status(PoseModelConfiguration config) {
        if (!config.enabled()) {
            return new PoseModelStatus(false, config.provider(), "Pose model is disabled");
        }
        if (config.provider().isBlank() || config.provider().equalsIgnoreCase("none")) {
            return new PoseModelStatus(false, config.provider(), "Pose model provider is not configured");
        }
        if (config.modelPath().isBlank()) {
            return new PoseModelStatus(false, config.provider(), "Pose model path is not configured");
        }
        if (!Files.isRegularFile(Path.of(config.modelPath()))) {
            return new PoseModelStatus(false, config.provider(), "Pose model file was not found");
        }
        return new PoseModelStatus(true, config.provider(), "Pose model configuration is ready");
    }
}
