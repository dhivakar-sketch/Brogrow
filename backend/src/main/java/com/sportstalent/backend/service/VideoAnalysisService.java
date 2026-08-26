package com.sportstalent.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VideoAnalysisService {
    private static final Path UPLOAD_DIR = Paths.get("uploads", "video-analysis");

    public Map<String, Object> acceptVideo(MultipartFile video, String athleteId, String sport) throws IOException {
        Files.createDirectories(UPLOAD_DIR);

        String original = video.getOriginalFilename() == null ? "video" : video.getOriginalFilename();
        String safeName = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        String jobId = UUID.randomUUID().toString();
        Path target = UPLOAD_DIR.resolve(jobId + "-" + safeName).normalize();
        if (!target.startsWith(UPLOAD_DIR.toAbsolutePath().normalize())) {
            throw new IOException("Invalid video path");
        }

        video.transferTo(target);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "PROCESSING");
        response.put("jobId", jobId);
        response.put("message", "Video stored successfully. Pose analysis job is ready for the OpenCV/MediaPipe worker.");
        response.put("athleteId", athleteId == null ? "" : athleteId);
        response.put("sport", sport == null ? "" : sport);
        response.put("fileName", original);
        response.put("sizeBytes", video.getSize());
        response.put("score", null);
        response.put("confidence", null);
        response.put("issues", List.of());
        return response;
    }
}
