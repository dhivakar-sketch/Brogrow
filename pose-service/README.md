# Brogrow MediaPipe Pose Service

This local Python sidecar runs MediaPipe Pose inference. The Spring Boot video
processor sends sampled frames as JPEG and receives 33 normalized pose landmarks.

## Requirements
- Python 3.10 or 3.11 (MediaPipe 0.10.21 wheel support)
- pip

## Run (Windows PowerShell)
```powershell
cd pose-service
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

## Run (macOS/Linux)
```bash
cd pose-service
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Check `http://127.0.0.1:8001/health`. Keep this service on localhost; it has
no authentication and is intended only for local development. Start it before
submitting a video to the Spring Boot API.

Spring Boot setting: `POSE_SERVICE_URL=http://127.0.0.1:8001` (default).
