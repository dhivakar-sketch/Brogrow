package com.example.sportstalentassessment.video;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/video-analysis")
@CrossOrigin(origins = "http://localhost:5173")
public class VideoAnalysisController {
    private final VideoAnalysisService service;
    private final VideoProcessingService processingService;

    public VideoAnalysisController(VideoAnalysisService service, VideoProcessingService processingService) {
        this.service = service;
        this.processingService = processingService;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> submit(
            @RequestPart("video") MultipartFile video,
            @RequestParam(required = false) String athleteId,
            @RequestParam(required = false) String sport) {
        try {
            VideoAnalysisResult queued = service.submit(video, athleteId, sport);
            Path videoPath = service.getVideoPath(queued.jobId());
            if (videoPath == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Uploaded video could not be located."));
            }
            processingService.process(queued.jobId(), videoPath, sport);
            return ResponseEntity.accepted().body(queued);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Unable to store video."));
        }
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<?> get(@PathVariable String jobId) {
        VideoAnalysisResult result = service.get(jobId);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(result);
    }
}
