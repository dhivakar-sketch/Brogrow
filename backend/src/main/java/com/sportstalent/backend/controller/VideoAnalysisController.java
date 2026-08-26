package com.sportstalent.backend.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/video-analysis")
public class VideoAnalysisController {

    private static final long MAX_VIDEO_BYTES = 100L * 1024L * 1024L;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> analyze(
            @RequestParam("video") MultipartFile video,
            @RequestParam(value = "athleteId", required = false) String athleteId,
            @RequestParam(value = "sport", required = false) String sport) {

        if (video == null || video.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please upload a video."));
        }
        if (video.getSize() > MAX_VIDEO_BYTES) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("message", "Video must be 100 MB or smaller."));
        }
        String contentType = video.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("video/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only video files are supported."));
        }

        // Processing pipeline will be connected to OpenCV/MediaPipe in the next stage.
        // The API intentionally returns no fabricated AI score or errors.
        List<Object> issues = new ArrayList<>();
        return ResponseEntity.ok(Map.of(
                "status", "UPLOADED",
                "message", "Video received successfully. AI processing pipeline is ready to be connected.",
                "athleteId", athleteId == null ? "" : athleteId,
                "sport", sport == null ? "" : sport,
                "fileName", video.getOriginalFilename() == null ? "video" : video.getOriginalFilename(),
                "sizeBytes", video.getSize(),
                "score", 0,
                "confidence", 0,
                "issues", issues
        ));
    }
}
