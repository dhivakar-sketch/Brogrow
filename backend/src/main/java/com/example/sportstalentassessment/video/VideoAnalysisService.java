package com.example.sportstalentassessment.video;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VideoAnalysisService {
    private static final long MAX_BYTES = 100L * 1024L * 1024L;
    private static final Path UPLOAD_DIR = Path.of("uploads", "video-analysis");

    private final Map<String, VideoAnalysisResult> jobs = new ConcurrentHashMap<>();

    public VideoAnalysisResult submit(MultipartFile video, String athleteId, String sport) throws IOException {
        if (video == null || video.isEmpty()) {
            throw new IllegalArgumentException("Video file is required.");
        }
        if (video.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Video must be 100 MB or smaller.");
        }
        String contentType = video.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            throw new IllegalArgumentException("Only video files are supported.");
        }

        Files.createDirectories(UPLOAD_DIR);
        String jobId = UUID.randomUUID().toString();
        String extension = extension(video.getOriginalFilename());
        Path destination = UPLOAD_DIR.resolve(jobId + extension);
        Files.copy(video.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        VideoAnalysisResult queued = new VideoAnalysisResult(
                jobId,
                "QUEUED",
                sport == null ? "" : sport,
                0,
                0,
                0,
                0,
                List.of()
        );
        jobs.put(jobId, queued);
        return queued;
    }

    public VideoAnalysisResult get(String jobId) {
        return jobs.get(jobId);
    }

    private String extension(String name) {
        if (name == null || !name.contains(".")) return ".mp4";
        String ext = name.substring(name.lastIndexOf('.')).toLowerCase();
        return ext.matches("\\.[a-z0-9]{1,8}") ? ext : ".mp4";
    }
}
