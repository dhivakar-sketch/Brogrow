package com.example.sportstalentassessment.video;

import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class VideoProcessingService {
    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final VideoAnalysisService analysisService;

    public VideoProcessingService(VideoAnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    /**
     * Starts processing only after the uploaded file has been persisted.
     * The actual pose engine is isolated here so OpenCV/MediaPipe can be
     * introduced without coupling the upload controller to native libraries.
     */
    public void process(String jobId, Path videoPath, String sport) {
        executor.submit(() -> {
            if (!Files.exists(videoPath)) {
                return;
            }
            // Pose-engine adapter is the next replaceable stage.
            // Until an OpenCV/MediaPipe JVM runtime is configured, do not
            // fabricate scores or technique errors.
            analysisService.markProcessing(jobId, sport);
        });
    }
}
