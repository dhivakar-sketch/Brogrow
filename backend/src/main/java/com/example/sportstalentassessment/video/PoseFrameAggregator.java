package com.example.sportstalentassessment.video;

import java.util.ArrayList;
import java.util.List;

/** Collects valid pose measurements across sampled frames and exposes stable averages. */
public class PoseFrameAggregator {
    private final List<PoseMetrics> samples = new ArrayList<>();

    public void add(PoseMetrics metrics) {
        if (metrics == null) return;
        if (metrics.leftKneeAngle() < 0 || metrics.rightKneeAngle() < 0
                || metrics.leftElbowAngle() < 0 || metrics.rightElbowAngle() < 0) return;
        samples.add(metrics);
    }

    public int count() {
        return samples.size();
    }

    public PoseMetrics average() {
        if (samples.isEmpty()) {
            return new PoseMetrics(-1, -1, -1, -1, 0, 0);
        }
        double lk = 0, rk = 0, le = 0, re = 0, st = 0, ht = 0;
        for (PoseMetrics m : samples) {
            lk += m.leftKneeAngle(); rk += m.rightKneeAngle();
            le += m.leftElbowAngle(); re += m.rightElbowAngle();
            st += m.shoulderTilt(); ht += m.hipTilt();
        }
        double n = samples.size();
        return new PoseMetrics(lk / n, rk / n, le / n, re / n, st / n, ht / n);
    }
}
