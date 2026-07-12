#!/usr/bin/env python3
"""Demo de desminado: el robot repite la ruta fija de ruta.yaml transmitiendo
video en vivo; al terminar la ruta activa la deteccion de minas (objetos
amarillos) y todo se monitorea desde un sitio web servido por la propia Pi.

En el robot:   sudo python3 demo.py        -> abrir http://<ip-de-la-pi>:8000
Prueba en PC:  python3 demo.py --sim       (usa la webcam del PC, sin robot)
"""
import argparse
import json
import threading
import time

import cv2
import numpy as np
import yaml
from flask import Flask, Response, jsonify, render_template_string

# ------------------------------------------------------------------ estado

estado = {
    "fase": "iniciando",        # iniciando | en_ruta | escaneando | fin
    "paso": "",
    "detecciones": [],          # [{id, t, hora, area}]
    "inicio": time.time(),
}
cajas_actuales = []             # bboxes de la deteccion en curso, para el overlay
lock = threading.Lock()


# ------------------------------------------------------------------ camara

class Camara:
    """Un solo hilo captura; streaming y deteccion leen el ultimo frame."""

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
            print("Camara: webcam (modo PC)" if self.cap.isOpened()
                  else "Camara: NO DISPONIBLE (frame gris)")
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

def detectar_minas(frame, rangos, area_min):
    """Blobs del color configurado. Devuelve [(cx, cy, area, (x,y,w,h)), ...]"""
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    mask = np.zeros(hsv.shape[:2], np.uint8)
    for lo, hi in rangos:
        mask |= cv2.inRange(hsv, np.array(lo), np.array(hi))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    out = []
    contornos, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for c in contornos:
        area = cv2.contourArea(c)
        if area < area_min:
            continue
        x, y, w, h = cv2.boundingRect(c)
        out.append((x + w // 2, y + h // 2, area, (x, y, w, h)))
    return out


def registrar_detecciones(dets, cfg):
    """Deduplica por posicion en pantalla y notifica las nuevas."""
    global cajas_actuales
    nuevas = []
    with lock:
        cajas_actuales = [d[3] for d in dets]
        conocidas = [d for d in estado["detecciones"]]
        for cx, cy, area, _ in dets:
            if any(abs(k["cx"] - cx) < 80 and abs(k["cy"] - cy) < 80 for k in conocidas):
                continue
            det = {
                "id": len(estado["detecciones"]) + 1,
                "cx": cx, "cy": cy, "area": int(area),
                "t": round(time.time() - estado["inicio"], 1),
                "hora": time.strftime("%H:%M:%S"),
            }
            estado["detecciones"].append(det)
            conocidas.append(det)
            nuevas.append(det)
            print(f"  MINA #{det['id']} detectada ({det['hora']})")

    if cfg.get("webhook"):
        for det in nuevas:
            try:
                import requests
                requests.post(cfg["webhook"], json=det, timeout=3)
            except Exception as e:
                print(f"  (webhook fallo: {e})")


# ------------------------------------------------------------------ robot

class RobotReal:
    def __init__(self, cfg):
        from picrawler import Picrawler
        self.crawler = Picrawler()
        self.crawler.move_list.angle = cfg.get("angulo_giro", 30)
        self.vel = cfg.get("velocidad", 80)
        self.crawler.do_action("stand", 1, self.vel)
        time.sleep(0.5)

    def do(self, accion, veces):
        self.crawler.do_action(accion, veces, self.vel)

    def terminar(self):
        self.crawler.do_action("sit", 1, 40)


class RobotSim:
    def __init__(self, cfg):
        pass

    def do(self, accion, veces):
        time.sleep(0.4 * veces)     # simula la duracion de los pasos

    def terminar(self):
        pass


# ------------------------------------------------------------------ mision

def correr_mision(robot, cam, cfg):
    global cajas_actuales
    pasos = cfg["ruta"]
    with lock:
        estado["fase"] = "en_ruta"
        estado["inicio"] = time.time()

    for i, paso in enumerate(pasos):
        with lock:
            estado["paso"] = f"{i + 1}/{len(pasos)}: {paso['accion']}"
        print(f"Ruta {estado['paso']}")
        if paso["accion"] == "pausa":
            time.sleep(paso.get("segundos", 1))
        else:
            robot.do(paso["accion"], paso.get("veces", 1))

    print("Fin de ruta: activando deteccion de minas...")
    with lock:
        estado["fase"] = "escaneando"
        estado["paso"] = "buscando objetos amarillos"

    fin = time.time() + cfg["escaneo"]["duracion_s"]
    while time.time() < fin:
        dets = detectar_minas(cam.ultimo(), cfg["color_mina"], cfg.get("area_minima", 500))
        registrar_detecciones(dets, cfg)
        if cfg["escaneo"].get("barrido"):
            robot.do("turn left angle", 1)
        time.sleep(0.25)

    robot.terminar()
    with lock:
        estado["fase"] = "fin"
        estado["paso"] = f"{len(estado['detecciones'])} minas encontradas"
        cajas_actuales = []
    with open("minas.json", "w") as f:
        json.dump(estado["detecciones"], f, indent=2)
    print(f"== FIN == {estado['paso']} (minas.json)")


# ------------------------------------------------------------------ web

PAGINA = """<!doctype html><html lang=es><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>Monitoreo PiCrawler</title><style>
body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#111827;color:#e5e7eb}
header{padding:14px 22px;background:#1f2937;display:flex;gap:14px;align-items:center}
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
setInterval(async()=>{const e=await(await fetch('/estado')).json();
const f=document.getElementById('fase');f.textContent=e.fase.replace('_',' ');
f.className=e.fase;document.getElementById('paso').textContent=e.paso;
document.getElementById('n').textContent=e.detecciones.length;
document.getElementById('lista').innerHTML=e.detecciones.map(d=>
`<li><b>Mina #${d.id}</b> &mdash; ${d.hora} (t+${d.t}s)</li>`).reverse().join('');
},1000);
</script></body></html>"""


def crear_app(cam, cfg):
    app = Flask(__name__)

    @app.route("/")
    def index():
        return render_template_string(PAGINA)

    @app.route("/estado")
    def _estado():
        with lock:
            return jsonify(estado)

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

    with open("ruta.yaml") as f:
        cfg = yaml.safe_load(f)

    cam = Camara()
    robot = RobotSim(cfg) if args.sim else RobotReal(cfg)
    threading.Thread(target=correr_mision, args=(robot, cam, cfg), daemon=True).start()

    puerto = cfg.get("puerto_web", 8000)
    print(f"Dashboard en http://0.0.0.0:{puerto}  (desde otro equipo: http://<ip-de-la-pi>:{puerto})")
    crear_app(cam, cfg).run(host="0.0.0.0", port=puerto, threaded=True)


if __name__ == "__main__":
    main()
