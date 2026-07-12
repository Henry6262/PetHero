#!/usr/bin/env python3
"""Demo de desminado.

1. Reproduce la ruta grabada en ruta.json (con grabar.py), transmitiendo video
   en vivo todo el trayecto SIN detectar nada.
2. Al terminar la ruta activa la deteccion de minas (objetos AMARILLOS).
3. El sitio web (servido por esta misma Pi) muestra el video MJPEG y recibe
   cada deteccion al instante por Server-Sent Events.

En el robot:   sudo python3 demo.py        -> abrir http://<ip-de-la-pi>:8000
Prueba en PC:  python3 demo.py --sim       (webcam del PC, sin robot)
"""
import argparse
import json
import threading
import time

import cv2
import numpy as np
from flask import Flask, Response, make_response

# ----------------------------- configuracion --------------------------------
PUERTO = 8000
DURACION_ESCANEO_S = 90          # cuanto tiempo escanea minas al final de la ruta
AMARILLO_HSV = ([20, 100, 100], [35, 255, 255])   # rango del color "mina"
AREA_MINIMA = 500                # px^2 minimos para aceptar una deteccion
ACTION_GAP = 0.25                # pausa entre acciones al reproducir (como al grabar)
# -----------------------------------------------------------------------------

estado = {"fase": "iniciando", "paso": "", "detecciones": []}
cajas_actuales = []              # bboxes en pantalla durante el escaneo (overlay)
lock = threading.Lock()
t0 = time.time()


# ------------------------------------------------------------------ camara

class Camara:
    """Un hilo captura frames; el streaming y la deteccion leen el ultimo."""

    def __init__(self):
        self.frame = None
        self.flock = threading.Lock()
        try:
            from picamera2 import Picamera2
            self.picam = Picamera2()
            cfg = self.picam.create_video_configuration(
                main={"size": (640, 480), "format": "RGB888"})
            self.picam.configure(cfg)
            self.picam.start()
            self._leer = self.picam.capture_array
            print("Camara: picamera2 (Raspberry)")
        except Exception:
            self.cap = cv2.VideoCapture(0)
            self._leer = self._leer_webcam
            print("Camara: webcam del PC" if self.cap.isOpened()
                  else "Camara: NO DISPONIBLE (se transmite frame gris)")
        threading.Thread(target=self._bucle, daemon=True).start()

    def _leer_webcam(self):
        ok, f = self.cap.read()
        return f if ok else None

    def _bucle(self):
        while True:
            f = self._leer()
            if f is not None:
                with self.flock:
                    self.frame = f
            time.sleep(0.03)

    def ultimo(self):
        with self.flock:
            if self.frame is None:
                return np.full((480, 640, 3), 60, np.uint8)
            return self.frame.copy()


# ------------------------------------------------------------------ deteccion

def detectar_amarillo(frame):
    """Blobs amarillos. Devuelve [(cx, cy, area, (x, y, w, h)), ...]"""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lo, hi = AMARILLO_HSV
    mask = cv2.inRange(hsv, np.array(lo), np.array(hi))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    out = []
    contornos, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in contornos:
        area = cv2.contourArea(c)
        if area >= AREA_MINIMA:
            x, y, w, h = cv2.boundingRect(c)
            out.append((x + w // 2, y + h // 2, area, (x, y, w, h)))
    return out


def registrar(dets):
    """Deduplica por posicion en pantalla; lo nuevo se anuncia por SSE."""
    global cajas_actuales
    with lock:
        cajas_actuales = [d[3] for d in dets]
        for cx, cy, area, _ in dets:
            if any(abs(k["cx"] - cx) < 80 and abs(k["cy"] - cy) < 80
                   for k in estado["detecciones"]):
                continue
            det = {"id": len(estado["detecciones"]) + 1,
                   "cx": cx, "cy": cy, "area": int(area),
                   "t": round(time.time() - t0, 1),
                   "hora": time.strftime("%H:%M:%S")}
            estado["detecciones"].append(det)
            print(f"  MINA #{det['id']} detectada ({det['hora']})")


# ------------------------------------------------------------------ robot

class RobotReal:
    def __init__(self):
        from picrawler import Picrawler
        self.crawler = Picrawler()
        self.crawler.do_action("stand", 1, 70)
        time.sleep(0.5)

    def do(self, paso):
        if "angulo" in paso:
            self.crawler.move_list.angle = paso["angulo"]
        self.crawler.do_action(paso["accion"], 1, paso.get("velocidad", 70))
        time.sleep(ACTION_GAP)

    def terminar(self):
        try:
            self.crawler.do_step("sit", 40)
        except Exception:
            pass


class RobotSim:
    def do(self, paso):
        time.sleep(0.4)

    def terminar(self):
        pass


# ------------------------------------------------------------------ mision

def poner_fase(fase, paso=""):
    with lock:
        estado["fase"] = fase
        estado["paso"] = paso


def correr_mision(robot, cam, ruta):
    global cajas_actuales, t0
    t0 = time.time()

    poner_fase("en_ruta")
    for i, paso in enumerate(ruta):
        poner_fase("en_ruta", f"{i + 1}/{len(ruta)}: {paso['accion']}")
        if paso["accion"] == "pausa":
            time.sleep(paso.get("segundos", 1.0))
        else:
            robot.do(paso)

    print("Fin de ruta -> activando deteccion de minas")
    poner_fase("escaneando", "buscando objetos amarillos")
    fin = time.time() + DURACION_ESCANEO_S
    while time.time() < fin:
        registrar(detectar_amarillo(cam.ultimo()))
        time.sleep(0.2)

    robot.terminar()
    with lock:
        n = len(estado["detecciones"])
        cajas_actuales = []
        json.dump(estado["detecciones"], open("minas.json", "w"), indent=1)
    poner_fase("fin", f"{n} minas encontradas")
    print(f"== FIN == {n} minas (minas.json)")


# ------------------------------------------------------------------ web

PAGINA = """<!doctype html><html lang=es><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>Monitoreo PiCrawler</title><style>
body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#111827;color:#e5e7eb}
header{padding:14px 22px;background:#1f2937;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
h1{font-size:17px;margin:0}#fase{padding:3px 12px;border-radius:99px;font-weight:600}
.en_ruta{background:#1d4ed8}.escaneando{background:#b45309}.fin{background:#15803d}
.iniciando{background:#4b5563}
main{display:flex;flex-wrap:wrap;gap:18px;padding:18px 22px}
img{max-width:640px;width:100%;border-radius:8px;background:#000}
aside{flex:1;min-width:260px}h2{font-size:14px;color:#9ca3af;margin:4px 0 8px}
#n{font-size:42px;font-weight:700;color:#f87171}
li{background:#1f2937;margin:6px 0;padding:8px 12px;border-radius:6px;list-style:none;
border-left:4px solid #f87171}ul{padding:0;margin:0}#paso{color:#9ca3af}
</style></head><body>
<header><h1>&#129302; PiCrawler &mdash; Monitoreo de desminado</h1>
<span id=fase class=iniciando>iniciando</span><span id=paso></span></header>
<main>
<div><img src=/video alt="video en vivo"></div>
<aside><h2>Minas detectadas</h2><div id=n>0</div><ul id=lista></ul></aside>
</main>
<script>
const es = new EventSource('/eventos');
es.addEventListener('fase', e => {
  const d = JSON.parse(e.data), f = document.getElementById('fase');
  f.textContent = d.fase.replace('_',' '); f.className = d.fase;
  document.getElementById('paso').textContent = d.paso;
});
es.addEventListener('mina', e => {
  const d = JSON.parse(e.data), li = document.createElement('li');
  li.innerHTML = `<b>Mina #${d.id}</b> &mdash; ${d.hora} (t+${d.t}s)`;
  const ul = document.getElementById('lista'); ul.insertBefore(li, ul.firstChild);
  document.getElementById('n').textContent = d.id;
});
</script></body></html>"""


def crear_app(cam):
    app = Flask(__name__)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    @app.route("/")
    def index():
        return PAGINA

    @app.route("/eventos")
    def eventos():
        def gen():
            enviadas = 0
            ultima_fase = None
            while True:
                with lock:
                    nuevas = estado["detecciones"][enviadas:]
                    fase = (estado["fase"], estado["paso"])
                for d in nuevas:
                    yield f"event: mina\ndata: {json.dumps(d)}\n\n"
                    enviadas += 1
                if fase != ultima_fase:
                    ultima_fase = fase
                    yield ("event: fase\ndata: "
                           + json.dumps({"fase": fase[0], "paso": fase[1]}) + "\n\n")
                time.sleep(0.3)
        return Response(gen(), mimetype="text/event-stream")

    @app.route("/video")
    def video():
        def gen():
            while True:
                frame = cam.ultimo()
                with lock:
                    fase, cajas = estado["fase"], list(cajas_actuales)
                if fase == "escaneando":
                    for (x, y, w, h) in cajas:
                        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 0, 255), 2)
                        cv2.putText(frame, "MINA", (x, y - 8),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                cv2.putText(frame, fase.replace("_", " ").upper(), (10, 28),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                ok, jpg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                if ok:
                    yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
                           + jpg.tobytes() + b"\r\n")
                time.sleep(0.07)   # ~14 fps
        return Response(gen(), mimetype="multipart/x-mixed-replace; boundary=frame")

    return app


# ------------------------------------------------------------------ main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sim", action="store_true", help="sin robot (webcam del PC)")
    args = ap.parse_args()

    try:
        with open("ruta.json") as f:
            ruta = json.load(f)
        print(f"Ruta cargada: {len(ruta)} pasos")
    except FileNotFoundError:
        print("AVISO: no existe ruta.json (grabala con grabar.py). Ruta de prueba de 3 pasos.")
        ruta = [{"accion": "forward", "velocidad": 70}] * 3

    cam = Camara()
    robot = RobotSim() if args.sim else RobotReal()
    threading.Thread(target=correr_mision, args=(robot, cam, ruta), daemon=True).start()

    print(f"Dashboard: http://<ip-de-la-pi>:{PUERTO}")
    crear_app(cam).run(host="0.0.0.0", port=PUERTO, threaded=True)


if __name__ == "__main__":
    main()
