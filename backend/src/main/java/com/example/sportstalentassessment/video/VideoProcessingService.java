package com.example.sportstalentassessment.video;

import org.opencv.core.Mat;
import org.opencv.videoio.VideoCapture;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class VideoProcessingService {
    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final VideoAnalysisService analysisService;
    private final OpenCvVideoAnalyzer openCvAnalyzer;
    private final PoseDetector poseDetector;
    private final VideoPosePipeline posePipeline;

    public VideoProcessingService(VideoAnalysisService analysisService,
                                  OpenCvVideoAnalyzer openCvAnalyzer,
                                  PoseDetector poseDetector,
                                  SportTechniqueRuleService rules) {
        this.analysisService = analysisService;
        this.openCvAnalyzer = openCvAnalyzer;
        this.poseDetector = poseDetector;
        this.posePipeline = new VideoPosePipeline(rules);
    }

    public void process(String jobId, Path videoPath, String sport) {
        executor.submit(() -> {
            if (!Files.exists(videoPath)) {
                analysisService.markFailed(jobId, sport);
                return;
            }
            analysisService.markProcessing(jobId, sport);
            try {
                OpenCvVideoAnalyzer.Metrics base = openCvAnalyzer.analyze(videoPath);
                PoseScan scan = scanPoses(videoPath, sport);
                analysisService.markAnalyzed(jobId, sport, base.frames(), base.fps(),
                        scan.poseDetectedFrames(), base.frames(), scan.findings());
            } catch (RuntimeException ex) {
                analysisService.markFailed(jobId, sport);
            }
        });
    }

    private PoseScan scanPoses(Path videoPath, String sport) {
        VideoCapture capture = new VideoCapture(videoPath.toString());
        if (!capture.isOpened()) throw new IllegalStateException("Unable to open video for pose scan");

        PoseFrameAggregator aggregator = new PoseFrameAggregator();
        List<VideoAnalysisResult.VideoFinding> findings = new ArrayList<>();
        Mat frame = new Mat();
        int detected = 0;
        int index = 0;
        try {
            while (capture.read(frame)) {
                // Sampling keeps processing bounded while retaining temporal coverage.
                if (index++ % 3 != 0) continue;
                poseDetector.detect(frame).flatMap(points -> posePipeline.evaluate(sport, points))
                        .ifPresent(assessment -> {
                            aggregator.add(assessment.metrics());
                            findings.addAll(assessment.findings());
                        });
                if (aggregator.count() > detected) detected = aggregator.count();
            }
        } finally {
            frame.release();
            capture.release();
        }
        return new PoseScan(detected, findings);
    }

    private record PoseScan(int poseDetectedFrames, List<VideoAnalysisResult.VideoFinding> findings) {}
}
