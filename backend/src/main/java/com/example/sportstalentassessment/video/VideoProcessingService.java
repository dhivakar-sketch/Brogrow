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
    private final OpenCvVideoAnalyzer openCvAnalyzer;

    public VideoProcessingService(VideoAnalysisService analysisService, OpenCvVideoAnalyzer openCvAnalyzer) {
        this.analysisService = analysisService;
        this.openCvAnalyzer = openCvAnalyzer;
    }

    public void process(String jobId, Path videoPath, String sport) {
        executor.submit(() -> {
            if (!Files.exists(videoPath)) {
                analysisService.markFailed(jobId, sport);
                return;
            }
            analysisService.markProcessing(jobId, sport);
            try {
                OpenCvVideoAnalyzer.Metrics metrics = openCvAnalyzer.analyze(videoPath);
                analysisService.markAnalyzed(jobId, sport, metrics.frames(), metrics.fps());
            } catch (RuntimeException ex) {
                analysisService.markFailed(jobId, sport);
            }
        });
    }
}
