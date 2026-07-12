# Hardware Adapters

This folder contains the Python adapters that bridge the physical robots to the Operator C2 server.

See [`docs/hackathon/ROBOT_INTEGRATION.md`](../docs/hackathon/ROBOT_INTEGRATION.md) for the full HTTP contract.

## Adapters

- `adapter_base.py` — shared Flask base with HMAC signing, telemetry loop, and report dispatch.
- `picrawler_adapter.py` — Pi Crawler (payload carrier + AI camera sentry).
- `quadruped_adapter.py` — Quadruped robot (scout / mobile responder).
- `robotarm_adapter.py` — Robot arm (checkpoint actuator / barrier).

## Raspberry Pi mission code

- `raspberry/mision_minas/` — onboard PiCrawler demo copied from the Pi: teleop route recorder (`grabar.py`), replay + yellow-mine detection (`demo.py`), and an archived autonomous grid-navigation version (`_archivo/`). Edit locally, then sync back to the Pi with `rsync -av hardware/raspberry/mision_minas/ pi@<IP>:~/mision_minas/`.

## Quick start

```bash
cd hardware
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 picrawler_adapter.py
```

## Environment variables

```bash
export OPERATOR_URL="http://192.168.1.10:3069"
export ROBOT_SECRET="your-shared-hmac-secret"
export ROBOT_ID="crawler-01"
export ROBOT_ROLE="payload"
```

## Simulated development

If hardware is not available, use the simulated robot drivers in `src/core/robot-commander.ts` on the software side.
