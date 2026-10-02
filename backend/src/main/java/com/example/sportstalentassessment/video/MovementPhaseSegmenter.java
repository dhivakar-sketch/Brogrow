package com.example.sportstalentassessment.video;

import java.util.ArrayList;
import java.util.List;

/**
 * Splits sampled pose motion into coarse activity phases.
 *
 * Motion values are normalized landmark displacement between adjacent valid
 * samples. This is a generic activity segmentation aid, not a sport-specific
 * action classifier or a technique diagnosis.
 */
public final class MovementPhaseSegmenter {
    private MovementPhaseSegmenter() {}

    public enum Phase { SETUP, ACTION, RECOVERY }

    public record Sample(double timestampSeconds, double motion) {}
    public record Segment(Phase phase, double startSeconds, double endSeconds,
                          int sampleCount, double averageMotion) {}

    /**
     * Labels low-motion samples before and after the most active region as
     * setup/recovery, and the active region as action. Returns no segments
     * when fewer than three valid samples are supplied.
     */
    public static List<Segment> segment(List<Sample> samples, double motionThreshold) {
        if (samples == null || samples.size() < 3 || !Double.isFinite(motionThreshold)
                || motionThreshold < 0) return List.of();

        List<Sample> valid = samples.stream()
                .filter(s -> s != null && Double.isFinite(s.timestampSeconds())
                        && s.timestampSeconds() >= 0 && Double.isFinite(s.motion())
                        && s.motion() >= 0)
                .toList();
        if (valid.size() < 3) return List.of();

        int peak = -1;
        double peakMotion = motionThreshold;
        for (int i = 0; i < valid.size(); i++) {
            if (valid.get(i).motion() > peakMotion) {
                peakMotion = valid.get(i).motion();
                peak = i;
            }
        }
        if (peak < 0) return List.of(new Segment(Phase.SETUP,
                valid.get(0).timestampSeconds(), valid.get(valid.size() - 1).timestampSeconds(),
                valid.size(), average(valid)));

        int start = peak;
        int end = peak;
        while (start > 0 && valid.get(start - 1).motion() > motionThreshold) start--;
        while (end + 1 < valid.size() && valid.get(end + 1).motion() > motionThreshold) end++;

        List<Segment> result = new ArrayList<>(3);
        if (start > 0) result.add(summarize(Phase.SETUP, valid.subList(0, start)));
        result.add(summarize(Phase.ACTION, valid.subList(start, end + 1)));
        if (end + 1 < valid.size()) result.add(summarize(Phase.RECOVERY, valid.subList(end + 1, valid.size())));
        return List.copyOf(result);
    }

    private static Segment summarize(Phase phase, List<Sample> samples) {
        return new Segment(phase, samples.get(0).timestampSeconds(),
                samples.get(samples.size() - 1).timestampSeconds(), samples.size(), average(samples));
    }

    private static double average(List<Sample> samples) {
        return samples.stream().mapToDouble(Sample::motion).average().orElse(0);
    }
}
