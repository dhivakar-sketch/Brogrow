package com.example.sportstalentassessment.video;

import org.opencv.core.Mat;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Central entry point for the real pose model adapter. Keeping model loading
 * behind this factory prevents the API layer from depending on a particular
 * inference library or model format.
 */
@Component
public class PoseDetectorFactory {
    private final PoseDetector detector;

    public PoseDetectorFactory() {
        this.detector = new ModelBackedPoseDetector();
    }

    public Optional<VideoPosePipeline.PosePoints> detect(Mat frame) {
        return detector.detect(frame);
    }

    /**
     * Temporary fail-closed adapter until a licensed/bundled pose model is
     * supplied. It never invents landmarks, so an unconfigured model cannot
     * produce misleading athlete findings.
     */
    private static final class ModelBackedPoseDetector implements PoseDetector {
        @Override
        public Optional<VideoPosePipeline.PosePoints> detect(Mat frame) {
            return Optional.empty();
        }
    }
}
