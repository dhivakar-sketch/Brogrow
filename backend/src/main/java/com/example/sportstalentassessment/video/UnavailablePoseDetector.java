package com.example.sportstalentassessment.video;

import org.opencv.core.Mat;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Safe default until a trained Java pose model is bundled.
 * It never fabricates landmarks; frames are simply reported as not detected.
 */
@Component
public class UnavailablePoseDetector implements PoseDetector {
    @Override
    public Optional<VideoPosePipeline.PosePoints> detect(Mat frame) {
        return Optional.empty();
    }
}
