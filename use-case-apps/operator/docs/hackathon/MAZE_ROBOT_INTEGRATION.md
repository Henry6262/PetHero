# Maze Robot Integration Guide

How to connect the SunFounder PiCrawler + Raspberry Pi 5 + ultrasound + Raspberry Pi AI camera to the Operator maze demo.

## Hardware reference

- **Robot**: SunFounder PiCrawler quadruped (12 servos, Robot HAT).
- **Controller**: Raspberry Pi 5 with Raspberry Pi OS (64-bit).
- **Distance sensor**: HC-SR04 ultrasonic connected to Robot HAT pins `D2` (trigger) and `D3` (echo).
- **Camera**: Raspberry Pi AI Camera (IMX500) or any Pi Camera module.
- **Network**: Pi and laptop on the same Wi-Fi, or Pi as Wi-Fi AP.

## 1. Install PiCrawler software on the Pi

Clone the vendor repo and install dependencies:

```bash
# On the Raspberry Pi
cd ~
git clone https://github.com/sunfounder/picrawler.git
cd picrawler
sudo python3 setup.py install
```

Verify the robot moves:

```bash
cd ~/picrawler/examples
python3 1_move.py
```

Press Ctrl+C to stop. The robot should walk forward/backward and turn in place.

## 2. Wire the ultrasound sensor

The PiCrawler Robot HAT exposes `D2` and `D3` pins. Connect the HC-SR04:

| HC-SR04 | Robot HAT |
|---------|-----------|
| VCC     | 5V        |
| GND     | GND       |
| Trig    | D2        |
| Echo    | D3        |

Test it:

```bash
cd ~/picrawler/examples
python3 4_avoid.py
```

It prints distance readings and turns when something is closer than 15 cm.

## 3. Operator repo on the Pi

Copy the relevant Operator scripts to the Pi. You only need `scripts/picrawler_bridge.py` and the generated map/plan JSONs.

```bash
# From your laptop
scp use-case-apps/operator/scripts/picrawler_bridge.py pi@raspberrypi.local:~/operator_bridge.py
scp use-case-apps/operator/results/maze_extraction/bottle_maze_map.json pi@raspberrypi.local:~/maze_map.json
```

Install Python deps on the Pi:

```bash
ssh pi@raspberrypi.local
pip3 install requests
```

`picrawler` and `robot_hat` should already be installed from step 1.

## 4. Generate a plan on the laptop

Use the map JSON to create a gait plan:

```bash
cd use-case-apps/operator
python3 scripts/maze_solver.py \
  --input results/maze_extraction/bottle_maze_map.json \
  --output results/maze_extraction/bottle_maze_plan.json \
  --forward-steps-per-cell 3 \
  --turn-steps-per-90 2 \
  --speed 60
```

Copy the plan to the Pi and upload it to Operator:

```bash
scp results/maze_extraction/bottle_maze_plan.json pi@raspberrypi.local:~/maze_plan.json
```

Start Operator locally and load the map/plan:

```bash
cd use-case-apps/operator
bun run dev
```

In another terminal:

```bash
curl -X POST http://localhost:3069/api/maze/map \
  -H 'Content-Type: application/json' \
  -d @results/maze_extraction/bottle_maze_map.json

curl -X POST http://localhost:3069/api/maze/plan \
  -H 'Content-Type: application/json' \
  -d @results/maze_extraction/bottle_maze_plan.json
```

Or use the dashboard at `http://localhost:3069/maze/`.

## 5. Calibrate the robot on the floor

The PiCrawler has no encoders. You must measure how far it moves per gait step.

### Forward calibration

1. Place the robot on the floor with its nose aligned to a tape mark.
2. Run a small test script:

```python
from picrawler import Picrawler
from time import sleep

crawler = Picrawler()
SPEED = 60

for i in range(5):
    crawler.do_action('forward', 1, SPEED)
    sleep(0.5)
```

3. Measure the distance travelled in cm. If 5 steps = 30 cm, then 1 step ≈ 6 cm.
4. Decide your grid cell size (e.g., 5 cm). Then `forward_steps_per_cell = cell_size_cm / cm_per_step`.
   - Example: 5 cm cell / 6 cm per step ≈ 0.83 → use 1 step per cell and accept slight overshoot, or use smaller cells.

### Turn calibration

1. Place the robot on a large sheet of paper with a marked heading.
2. Run:

```python
from picrawler import Picrawler
from time import sleep

crawler = Picrawler()
for i in range(4):
    crawler.do_action('turn_left', 1, 60)
    sleep(0.5)
```

3. Measure how many `turn_left` steps make 90°. Use that as `turn_steps_per_90`.

Typical starting values:

| Surface | `forward_steps_per_cell` (5 cm cell) | `turn_steps_per_90` |
|---------|--------------------------------------|---------------------|
| Tile    | 1                                    | 2–3                 |
| Carpet  | 1–2                                  | 2–3                 |
| Concrete| 1                                    | 2                   |

Re-run `maze_solver.py` with your measured values.

## 6. Start the bridge on the Pi

The bridge polls Operator for gait commands and reports telemetry back.

```bash
ssh pi@raspberrypi.local
export OPERATOR_API=http://<laptop-ip>:3069
export CAMERA_URL=http://<pi-ip>:8080/?action=stream
python3 operator_bridge.py --api $OPERATOR_API --camera-url $CAMERA_URL --speed 60
```

Replace `<laptop-ip>` with the IP of the laptop running Operator.

If you do not have a camera stream yet, omit `CAMERA_URL`.

## 7. Run the mission

In the Operator dashboard or via curl:

```bash
curl -X POST http://localhost:3069/api/maze/execute
```

The bridge fetches commands one by one, moves the robot, and posts telemetry. If the ultrasound sees an obstacle closer than 15 cm, the bridge stops and reports `obstacle_detected: true`.

## 8. Camera stream (optional but recommended)

For the dashboard to show live video, run an MJPEG streamer on the Pi.

### With mjpg-streamer

```bash
sudo apt install cmake libjpeg-dev
# build mjpg-streamer from source
cd ~
git clone https://github.com/jacksonliam/mjpg-streamer.git
cd mjpg-streamer/mjpg-streamer-experimental
make
sudo make install

# Start streaming the Pi Camera
./mjpg_streamer -i "input_raspicam.so -x 640 -y 480 -fps 15" -o "output_http.so -p 8080 -w ./www"
```

### With picamera2 (Python)

```bash
pip3 install picamera2
python3 - <<'PY'
from picamera2 import Picamera2
from picamera2.encoders import JpegEncoder
from picamera2.outputs import FileOutput
import io, socketserver, http.server

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'multipart/x-mixed-replace; boundary=--jpgboundary')
        self.end_headers()
        picam2 = Picamera2()
        config = picam2.create_video_configuration(main={"size": (640, 480)})
        picam2.configure(config)
        buffer = io.BytesIO()
        encoder = JpegEncoder(q=30)
        output = FileOutput(buffer)
        picam2.start_encoder(encoder, output)
        picam2.start()
        while True:
            buffer.seek(0)
            buffer.truncate()
            output.write(buffer)
            frame = buffer.getvalue()
            self.wfile.write(b'--jpgboundary\r\n')
            self.wfile.write(b'Content-Type: image/jpeg\r\n')
            self.wfile.write(f'Content-Length: {len(frame)}\r\n\r\n'.encode())
            self.wfile.write(frame)
            self.wfile.write(b'\r\n')

socketserver.TCPServer(("", 8080), Handler).serve_forever()
PY
```

Then set `CAMERA_URL=http://<pi-ip>:8080/` when starting the bridge.

## 9. Mine detection with the AI camera

The PiCrawler bridge has a placeholder detector. To make it real:

### Option A — Color detection (fastest)

Use OpenCV to detect colored objects in the camera frame. Place bright red/orange "mines" inside the maze.

Tune HSV bounds on the Pi:

```python
import cv2
lower = (0, 100, 100)
upper = (10, 255, 255)
```

Then start the bridge with:

```bash
python3 operator_bridge.py --detect opencv --target-hsv-lower 0,100,100 --target-hsv-upper 10,255,255
```

### Option B — IMX500 AI Camera object detection

If using the Raspberry Pi AI Camera, run Sony's `imx500_object_detection_demo.py` and parse the output, or use the camera's network output directly.

Integration sketch:

```
Pi AI Camera ──> detection JSON ──> bridge ──> /api/maze/telemetry
```

## 10. What to tune if it does not work

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Robot turns too much / too little | Wrong `turn_steps_per_90` | Re-measure on the demo floor |
| Robot overshoots cells | Wrong `forward_steps_per_cell` | Re-measure; use smaller cells |
| Robot hits a crate | Ultrasound not firing or inflation too small | Check wiring; increase `robot_radius_m` in the map |
| Bridge cannot reach Operator | Firewall / wrong IP | Ping laptop from Pi; use Pi as AP if needed |
| Plan has no path | Start/end inside wall | Adjust start/end cells in the map JSON |
| Dashboard shows no video | Camera URL wrong | Open `CAMERA_URL` in a browser from the laptop |

## 11. Minimal one-shot test

On the Pi:

```bash
OPERATOR_API=http://<laptop-ip>:3069 python3 operator_bridge.py --speed 60
```

On the laptop:

```bash
cd use-case-apps/operator
curl -X POST http://localhost:3069/api/maze/execute
```

The robot should now execute the planned path.
