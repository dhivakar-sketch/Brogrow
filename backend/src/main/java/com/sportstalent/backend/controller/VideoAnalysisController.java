package com.sportstalent.backend.controller;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.sportstalent.backend.service.VideoAnalysisService;

@RestController
@RequestMapping("/api/video-analysis")
public class VideoAnalysisController {
    private static final long MAX_VIDEO_BYTES = 100L * 1024L * 1024L;
    private final VideoAnalysisService videoAnalysisService;

    public VideoAnalysisController(VideoAnalysisService videoAnalysisService) {
        this.videoAnalysisService = videoAnalysisService;
    }

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
        try {
            return ResponseEntity.accepted().body(videoAnalysisService.acceptVideo(video, athleteId, sport));
        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Unable to store the video for analysis."));
        }
    }
}
