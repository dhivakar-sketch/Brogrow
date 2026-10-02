package com.example.sportstalentassessment.video;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.opencv.core.Mat;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.core.MatOfByte;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

/** MediaPipe-backed detector adapter. The inference service is a local Python sidecar. */
@Component
public class PoseDetectorFactory {
    private final PoseDetector detector;

    public PoseDetectorFactory(
            @Value("${pose.service.url:http://127.0.0.1:8001}") String serviceUrl,
            ObjectMapper mapper) {
        this.detector = new MediaPipePoseDetector(serviceUrl, mapper);
    }

    public Optional<VideoPosePipeline.PosePoints> detect(Mat frame) {
        return detector.detect(frame);
    }

    private static final class MediaPipePoseDetector implements PoseDetector {
        private final String endpoint;
        private final ObjectMapper mapper;
        private final HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(2)).build();

        private MediaPipePoseDetector(String serviceUrl, ObjectMapper mapper) {
            this.endpoint = serviceUrl.replaceAll("/+$", "") + "/detect";
            this.mapper = mapper;
        }

        @Override
        public Optional<VideoPosePipeline.PosePoints> detect(Mat frame) {
            if (frame == null || frame.empty()) return Optional.empty();
            MatOfByte encoded = new MatOfByte();
            try {
                if (!Imgcodecs.imencode(".jpg", frame, encoded)) return Optional.empty();
                HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                        .timeout(Duration.ofSeconds(8))
                        .header("Content-Type", "image/jpeg")
                        .POST(HttpRequest.BodyPublishers.ofByteArray(encoded.toArray()))
                        .build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() != 200) return Optional.empty();
                JsonNode root = mapper.readTree(response.body());
                if (!root.path("detected").asBoolean(false)) return Optional.empty();
                JsonNode landmarks = root.path("landmarks");
                return Optional.of(new VideoPosePipeline.PosePoints(
                        point(landmarks, 23), point(landmarks, 25), point(landmarks, 27),
                        point(landmarks, 24), point(landmarks, 26), point(landmarks, 28),
                        point(landmarks, 11), point(landmarks, 13), point(landmarks, 15),
                        point(landmarks, 12), point(landmarks, 14), point(landmarks, 16)));
            } catch (Exception ignored) {
                // Sidecar unavailable or frame could not be inferred: do not fabricate a pose.
                return Optional.empty();
            } finally {
                encoded.release();
            }
        }

        private static org.opencv.core.Point point(JsonNode landmarks, int index) {
            JsonNode landmark = landmarks.path(index);
            if (landmark.isMissingNode() || landmark.path("visibility").asDouble(0) < 0.35) return null;
            return new org.opencv.core.Point(landmark.path("x").asDouble(), landmark.path("y").asDouble());
        }
    }
}
