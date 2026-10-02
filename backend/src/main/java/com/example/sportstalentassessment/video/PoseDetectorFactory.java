package com.example.sportstalentassessment.video;

import org.opencv.core.Mat;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Java-only pose detector boundary.
 *
 * The current backend uses OpenCV Java. A MediaPipe Java runtime/model must be
 * supplied before inference can be enabled; never return fabricated landmarks.
 */
@Component
public class PoseDetectorFactory {
    private final PoseDetector detector = new UnconfiguredPoseDetector();

    public Optional<VideoPosePipeline.PosePoints> detect(Mat frame) {
        return detector.detect(frame);
    }

    private static final class UnconfiguredPoseDetector implements PoseDetector {
        @Override
        public Optional<VideoPosePipeline.PosePoints> detect(Mat frame) {
            return Optional.empty();
        }
    }
}
