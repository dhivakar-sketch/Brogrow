package com.example.sportstalentassessment.video;

import org.opencv.core.Point;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/video-analysis")
@CrossOrigin(origins = "http://localhost:5173")
public class VideoAnalysisController {
    private final VideoAnalysisService service;
    private final VideoProcessingService processingService;
    private final SportTechniqueRuleService rules;

    public VideoAnalysisController(VideoAnalysisService service, VideoProcessingService processingService,
                                   SportTechniqueRuleService rules) {
        this.service = service;
        this.processingService = processingService;
        this.rules = rules;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> submit(@RequestPart("video") MultipartFile video,
            @RequestParam(required = false) String athleteId, @RequestParam(required = false) String sport) {
        try {
            VideoAnalysisResult queued = service.submit(video, athleteId, sport);
            Path videoPath = service.getVideoPath(queued.jobId());
            if (videoPath == null) return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Uploaded video could not be located."));
            // MediaPipe runs in the browser. Do not mark the job complete using the unconfigured
            // native detector; the browser submits actual landmark samples to the endpoint below.
            service.markProcessing(queued.jobId(), sport);
            return ResponseEntity.accepted().body(queued);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Unable to store video."));
        }
    }

    @PostMapping("/{jobId}/landmarks")
    public ResponseEntity<?> submitLandmarks(@PathVariable String jobId, @RequestBody LandmarkBatch batch) {
        VideoAnalysisResult current = service.get(jobId);
        if (current == null) return ResponseEntity.notFound().build();
        if (batch == null || batch.frames() == null || batch.frames().isEmpty()
                || batch.frames().size() > 2000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Provide between 1 and 2000 landmark frames."));
        }

        List<VideoAnalysisResult.VideoFinding> findings = new ArrayList<>();
        int detected = 0;
        double visibilitySum = 0;
        int visibilityCount = 0;
        double[] metricSums = new double[6];
        int metricCount = 0;
        VideoPosePipeline pipeline = new VideoPosePipeline(rules);
        for (List<Landmark> frame : batch.frames()) {
            if (frame == null || frame.size() < 29) continue;
            List<Integer> requiredIndices = List.of(11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28);
            List<Landmark> required = requiredIndices.stream().map(frame::get).toList();
            if (required.stream().anyMatch(p -> p == null || !finite(p) || p.visibility() < 0.5)) continue;
            detected++;
            for (Landmark p : required) { visibilitySum += p.visibility(); visibilityCount++; }
            VideoPosePipeline.PosePoints points = new VideoPosePipeline.PosePoints(
                    point(frame.get(23)), point(frame.get(25)), point(frame.get(27)),
                    point(frame.get(24)), point(frame.get(26)), point(frame.get(28)),
                    point(frame.get(11)), point(frame.get(13)), point(frame.get(15)),
                    point(frame.get(12)), point(frame.get(14)), point(frame.get(16)));
            var assessment = pipeline.evaluate(current.sport(), points);
            if (assessment.isPresent()) {
                var a = assessment.get();
                findings.addAll(a.findings());
                PoseMetrics m = a.metrics();
                double[] values = {m.leftKneeAngle(), m.rightKneeAngle(), m.leftElbowAngle(),
                        m.rightElbowAngle(), m.shoulderTilt(), m.hipTilt()};
                for (int i = 0; i < values.length; i++) {
                    if (Double.isFinite(values[i]) && values[i] >= 0) metricSums[i] += values[i];
                }
                metricCount++;
            }
        }
        if (detected == 0) {
            return ResponseEntity.unprocessableEntity().body(Map.of(
                    "message", "No frames contained all required body landmarks with at least 0.5 visibility. Try a clearer, full-body video."
            ));
        }
        Map<String, VideoAnalysisResult.VideoFinding> uniqueFindings = new java.util.LinkedHashMap<>();
        for (VideoAnalysisResult.VideoFinding finding : findings) {
            uniqueFindings.merge(finding.title(), finding, (previous, next) ->
                    new VideoAnalysisResult.VideoFinding(previous.title(), previous.description(),
                            previous.suggestion(), Math.max(previous.confidence(), next.confidence())));
        }
        double visibility = visibilitySum / visibilityCount * 100.0;
        PoseMetrics averageMetrics = metricCount == 0 ? null : new PoseMetrics(
                metricSums[0] / metricCount, metricSums[1] / metricCount,
                metricSums[2] / metricCount, metricSums[3] / metricCount,
                metricSums[4] / metricCount, metricSums[5] / metricCount);
        service.completeLandmarkAnalysis(jobId, current.sport(), batch.frames().size(), detected, visibility,
                averageMetrics, new ArrayList<>(uniqueFindings.values()));
        return ResponseEntity.ok(service.get(jobId));
    }

    private static boolean finite(Landmark p) {
        return Double.isFinite(p.x()) && Double.isFinite(p.y()) && Double.isFinite(p.z())
                && Double.isFinite(p.visibility());
    }
    private static Point point(Landmark p) { return new Point(p.x(), p.y()); }
    public record Landmark(double x, double y, double z, double visibility) {}
    public record LandmarkBatch(List<List<Landmark>> frames) {}

    @GetMapping("/{jobId}")
    public ResponseEntity<?> get(@PathVariable String jobId) {
        VideoAnalysisResult result = service.get(jobId);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(result);
    }
}