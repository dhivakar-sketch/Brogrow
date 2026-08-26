package com.example.sportstalentassessment.video;

import org.opencv.core.Point;

public final class PoseMetricCalculator {
    private PoseMetricCalculator() {}

    public static double angle(Point a, Point b, Point c) {
        double abx = a.x - b.x;
        double aby = a.y - b.y;
        double cbx = c.x - b.x;
        double cby = c.y - b.y;
        double denom = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
        if (denom == 0) return -1;
        double cosine = (abx * cbx + aby * cby) / denom;
        cosine = Math.max(-1.0, Math.min(1.0, cosine));
        return Math.toDegrees(Math.acos(cosine));
    }

    public static double tilt(Point a, Point b) {
        if (a == null || b == null) return 0;
        return Math.toDegrees(Math.atan2(b.y - a.y, b.x - a.x));
    }

    public static PoseMetrics fromPoints(Point leftHip, Point leftKnee, Point leftAnkle,
                                         Point rightHip, Point rightKnee, Point rightAnkle,
                                         Point leftShoulder, Point leftElbow, Point leftWrist,
                                         Point rightShoulder, Point rightElbow, Point rightWrist) {
        double leftKneeAngle = angle(leftHip, leftKnee, leftAnkle);
        double rightKneeAngle = angle(rightHip, rightKnee, rightAnkle);
        double leftElbowAngle = angle(leftShoulder, leftElbow, leftWrist);
        double rightElbowAngle = angle(rightShoulder, rightElbow, rightWrist);
        double shoulderTilt = tilt(leftShoulder, rightShoulder);
        double hipTilt = tilt(leftHip, rightHip);
        return new PoseMetrics(leftKneeAngle, rightKneeAngle, leftElbowAngle, rightElbowAngle,
                shoulderTilt, hipTilt);
    }
}
