"""Pose-analysis worker for Sports Talent Assessment.

Reads a video, extracts MediaPipe pose landmarks frame-by-frame, and emits
JSON metrics. This module deliberately reports measurable landmark metrics
rather than inventing sport-specific errors; sport rules can consume the
metrics in the next layer.
"""
import argparse
import json
from pathlib import Path


def analyze(video_path: str, sport: str = "") -> dict:
    try:
        import cv2
        import mediapipe as mp
    except ImportError as exc:
        raise RuntimeError(
            "Install opencv-python and mediapipe before running pose analysis."
        ) from exc

    mp_pose = mp.solutions.pose
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Unable to open video: {video_path}")

    frames = 0
    detected = 0
    visibility_sum = 0.0
    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0

    with mp_pose.Pose(static_image_mode=False, model_complexity=1,
                      enable_segmentation=False,
                      min_detection_confidence=0.5,
                      min_tracking_confidence=0.5) as pose:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frames += 1
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = pose.process(rgb)
            if result.pose_landmarks:
                detected += 1
                visibility_sum += sum(
                    landmark.visibility for landmark in result.pose_landmarks.landmark
                ) / len(result.pose_landmarks.landmark)

    cap.release()
    detection_rate = (detected / frames * 100.0) if frames else 0.0
    avg_visibility = (visibility_sum / detected * 100.0) if detected else 0.0

    return {
        "status": "ANALYZED",
        "sport": sport,
        "frames": frames,
        "fps": round(fps, 2),
        "poseDetectedFrames": detected,
        "poseDetectionRate": round(detection_rate, 2),
        "averageLandmarkVisibility": round(avg_visibility, 2),
        "metrics": {
            "poseTrackingAvailable": detected > 0,
        },
        "issues": [],
        "note": "Sport-specific technique rules should consume these pose metrics; no fabricated errors are returned.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("video")
    parser.add_argument("--sport", default="")
    parser.add_argument("--output", default="-")
    args = parser.parse_args()
    result = analyze(args.video, args.sport)
    text = json.dumps(result, indent=2)
    if args.output == "-":
        print(text)
    else:
        Path(args.output).write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
