package com.example.sportstalentassessment.video;

import org.bytedeco.opencv.global.opencv_videoio;
import org.bytedeco.opencv.opencv_videoio.VideoCapture;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

@Component
public class OpenCvVideoAnalyzer {
    public Metrics analyze(Path videoPath) {
        VideoCapture capture = new VideoCapture(videoPath.toString());
        if (!capture.isOpened()) {
            throw new IllegalStateException("OpenCV could not open the uploaded video.");
        }

        double fps = capture.get(opencv_videoio.CAP_PROP_FPS);
        double frameCount = capture.get(opencv_videoio.CAP_PROP_FRAME_COUNT);
        capture.release();

        int frames = frameCount > 0 && frameCount <= Integer.MAX_VALUE
                ? (int) frameCount : 0;
        double durationSeconds = fps > 0 && frames > 0 ? frames / fps : 0;

        return new Metrics(frames, fps, durationSeconds);
    }

    public record Metrics(int frames, double fps, double durationSeconds) {}
}
