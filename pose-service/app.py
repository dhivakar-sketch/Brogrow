"""Local MediaPipe Pose sidecar for Brogrow video analysis."""
from flask import Flask, jsonify, request
import cv2
import mediapipe as mp
import numpy as np

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024
pose_api = mp.solutions.pose
pose = pose_api.Pose(
    static_image_mode=True,
    model_complexity=1,
    enable_segmentation=False,
    min_detection_confidence=0.5,
)

@app.get("/health")
def health():
    return jsonify({"status": "ok", "model": "MediaPipe Pose"})

@app.post("/detect")
def detect():
    if not request.data:
        return jsonify({"error": "JPEG frame is required"}), 400
    image = cv2.imdecode(np.frombuffer(request.data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        return jsonify({"error": "Invalid image"}), 400
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    result = pose.process(rgb)
    if not result.pose_landmarks:
        return jsonify({"detected": False, "landmarks": []})
    landmarks = [
        {"x": float(p.x), "y": float(p.y), "z": float(p.z),
         "visibility": float(p.visibility)}
        for p in result.pose_landmarks.landmark
    ]
    return jsonify({"detected": True, "landmarks": landmarks})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8001, threaded=False)
