package com.example.sportstalentassessment.video;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/video-analysis")
@CrossOrigin(origins = "http://localhost:5173")
public class VideoAnalysisController {
    private final VideoAnalysisService service;

    public VideoAnalysisController(VideoAnalysisService service) {
        this.service = service;
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> submit(
            @RequestPart("video") MultipartFile video,
            @RequestParam(required = false) String athleteId,
            @RequestParam(required = false) String sport) {
        try {
            return ResponseEntity.accepted().body(service.submit(video, athleteId, sport));
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
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
