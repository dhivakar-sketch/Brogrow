package com.example.sportstalentassessment.video;

import org.opencv.core.Mat;

import java.util.Optional;

/** Java-only pose detector boundary. A concrete detector can use a bundled
 * model without changing the upload/controller layer. */
public interface PoseDetector {
    Optional<VideoPosePipeline.PosePoints> detect(Mat frame);
}
