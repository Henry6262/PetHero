#!/usr/bin/env python3
"""Mision completa: ir del inicio a la meta (aproximadamente) y escanear minas.

Navegacion por dead reckoning (pasos y giros calibrados) + A* sobre el mapa
manual + ultrasonido para obstaculos imprevistos + homing visual opcional
hacia una baliza de color colocada en la meta.

En el robot:       sudo python3 navegar.py
Simulacion en PC:  python3 navegar.py --sim     (sin hardware, valida mapa y logica)
"""
import argparse
import json
import math
import signal
import time

from mapa import Mapa

VELOCIDAD = 80
TOL_WAYPOINT = 0.15      # m para dar un waypoint por alcanzado
TOL_META = 0.25          # m para dar la meta por alcanzada ("cercano" al punto)
DIST_ALERTA_CM = 15      # ultrasonido: distancia de obstaculo
MAX_ACCIONES = 500       # tope de seguridad de la mision
PASOS_ESCANEO = 12       # giros de ~30 grados = vuelta completa escaneando


def norm_ang(a):
    return math.atan2(math.sin(a), math.cos(a))


# ------------------------------------------------------------------ hardware

class RobotReal:
    def __init__(self, cal):
        from picrawler import Picrawler
        from robot_hat import Ultrasonic, Pin
        self.crawler = Picrawler()
        self.sonar = Ultrasonic(Pin("D2"), Pin("D3"))
        self.crawler.move_list.angle = cal["giro_cmd_deg"]
        self.crawler.do_action("stand", 1, VELOCIDAD)
        signal.signal(signal.SIGALRM, self._timeout)

    @staticmethod
    def _timeout(signum, frame):
        raise TimeoutError

    def avanzar(self):
        self.crawler.do_action("forward", 1, VELOCIDAD)

    def girar_izq(self):
        self.crawler.do_action("turn left angle", 1, VELOCIDAD)

    def girar_der(self):
        self.crawler.do_action("turn right angle", 1, VELOCIDAD)

    def distancia_cm(self):
        """Mediana de 5 lecturas con timeout (patron de examples/4_avoid.py)."""
        vals = []
        for _ in range(5):
            try:
                signal.alarm(1)
                d = self.sonar.read()
                signal.alarm(0)
                if d is not None and d > 0:
                    vals.append(d)
            except (TimeoutError, Exception):
                signal.alarm(0)
            time.sleep(0.02)
        if not vals:
            return None
        vals.sort()
        return vals[len(vals) // 2]

    def terminar(self):
        self.crawler.do_action("sit", 1, 40)


class RobotSim:
    """Sin hardware: los movimientos son exactos y no hay obstaculos imprevistos."""

    def __init__(self, cal):
        pass

    def avanzar(self):
        pass

    def girar_izq(self):
        pass

    def girar_der(self):
        pass

    def distancia_cm(self):
        return 999

    def terminar(self):
        pass


# ------------------------------------------------------------------ mision

class Mision:
    def __init__(self, sim=False):
        self.mapa = Mapa("escenario.yaml")
        try:
            with open("calibracion.json") as f:
                self.cal = json.load(f)
        except FileNotFoundError:
            print("AVISO: no hay calibracion.json (corre calibrar_pasos.py). Usando valores tipicos.")
            self.cal = {"paso_m": 0.06, "giro_cmd_deg": 30, "giro_real_deg": 30}

        self.paso = self.cal["paso_m"]
        self.giro = math.radians(self.cal["giro_real_deg"])

        ix, iy, ith = self.mapa.esc["inicio"]
        self.x, self.y, self.theta = ix, iy, math.radians(ith)
        self.meta = tuple(self.mapa.esc["meta"])
        self.trayectoria = [(self.x, self.y, self.theta)]
        self.minas = []
        self.acciones = 0

        self.robot = RobotSim(self.cal) if sim else RobotReal(self.cal)

        self.vision = None
        if not sim:
            try:
                from vision import Vision
                self.vision = Vision(self.mapa.esc["colores"])
                print("Camara lista (homing y escaneo activados).")
            except Exception as e:
                print(f"AVISO: camara no disponible ({e}). Sigo sin homing ni escaneo visual.")

    # ---- primitivas con actualizacion de la pose estimada ----

    def _avanzar(self):
        self.robot.avanzar()
        self.x += self.paso * math.cos(self.theta)
        self.y += self.paso * math.sin(self.theta)
        self._registrar()

    def _girar(self, sentido):
        if sentido > 0:
            self.robot.girar_izq()
        else:
            self.robot.girar_der()
        self.theta = norm_ang(self.theta + sentido * self.giro)
        self._registrar()

    def _registrar(self):
        self.acciones += 1
        self.trayectoria.append((self.x, self.y, self.theta))

    # ---- navegacion ----

    def _obstaculo_delante(self):
        d = self.robot.distancia_cm()
        return d is not None and d < DIST_ALERTA_CM, d

    def ir_a_meta(self):
        ruta = self.mapa.planificar((self.x, self.y), self.meta)
        if ruta is None:
            print("No hay ruta hacia la meta. Revisa el escenario.yaml")
            return False
        print(f"Ruta inicial: {[(round(x,2), round(y,2)) for x, y in ruta]}")

        while ruta and self.acciones < MAX_ACCIONES:
            wp = ruta[0]
            dist = math.hypot(wp[0] - self.x, wp[1] - self.y)
            if dist < TOL_WAYPOINT:
                ruta.pop(0)
                continue

            err = norm_ang(math.atan2(wp[1] - self.y, wp[0] - self.x) - self.theta)
            if abs(err) > self.giro / 2 + 0.05:
                self._girar(1 if err > 0 else -1)
                continue

            bloqueado, d = self._obstaculo_delante()
            if bloqueado:
                ox = self.x + (d / 100 + 0.05) * math.cos(self.theta)
                oy = self.y + (d / 100 + 0.05) * math.sin(self.theta)
                print(f"Obstaculo a {d:.0f} cm -> marcado en ({ox:.2f},{oy:.2f}), replanificando")
                self.mapa.marcar_obstaculo(ox, oy)
                ruta = self.mapa.planificar((self.x, self.y), self.meta)
                if ruta is None:
                    print("Sin ruta alternativa. Abortando.")
                    return False
                continue

            self._avanzar()
            if math.hypot(self.meta[0] - self.x, self.meta[1] - self.y) < TOL_META:
                break

        llegue = math.hypot(self.meta[0] - self.x, self.meta[1] - self.y) < TOL_META + 0.1
        print(f"Dead reckoning termino en ({self.x:.2f},{self.y:.2f}), "
              f"a {math.hypot(self.meta[0]-self.x, self.meta[1]-self.y):.2f} m de la meta")
        return llegue or not ruta

    def homing_baliza(self, max_pasos=25):
        """Correccion final: caminar hacia la baliza de color colocada en la meta."""
        if self.vision is None:
            return
        print("Homing visual hacia la baliza...")
        sin_ver = 0
        for _ in range(max_pasos):
            r = self.vision.detectar("baliza")
            if r is None:
                sin_ver += 1
                if sin_ver > 8:
                    print("Baliza no encontrada; me quedo con el dead reckoning.")
                    return
                self._girar(1)  # buscarla girando
                continue
            sin_ver = 0
            cx, area = r
            bloqueado, d = self._obstaculo_delante()
            if area > 20000 or (bloqueado and d is not None):
                print("Baliza alcanzada.")
                self.x, self.y = self.meta  # la baliza ESTA en la meta: corrige la pose
                return
            if abs(cx) > 0.20:
                self._girar(1 if cx < 0 else -1)
            else:
                self._avanzar()

    # ---- escaneo de minas ----

    def escanear(self):
        print("Escaneando minas (vuelta completa)...")
        if self.vision is None:
            print("Sin camara: escaneo simulado, 0 detecciones.")
            return
        for _ in range(PASOS_ESCANEO):
            r = self.vision.detectar("mina", area_min=300)
            if r:
                cx, area = r
                # Sin profundidad: se asume la mina a ~0.4 m en la direccion de la camara
                ang = self.theta - cx * math.radians(30)   # ~60 grados de FOV horizontal
                mx = self.x + 0.4 * math.cos(ang)
                my = self.y + 0.4 * math.sin(ang)
                if all(math.hypot(m["x"] - mx, m["y"] - my) > 0.25 for m in self.minas):
                    self.minas.append({"x": round(mx, 2), "y": round(my, 2), "area": area})
                    print(f"  MINA detectada -> ({mx:.2f}, {my:.2f})")
            self._girar(1)
            time.sleep(0.3)

    # ---- reporte ----

    def reporte(self):
        with open("minas.json", "w") as f:
            json.dump(self.minas, f, indent=2)
        salida = self.mapa.dibujar(trayectoria=self.trayectoria, minas=self.minas,
                                   salida="resultado.png")
        print(f"\n== FIN == {len(self.minas)} minas | {self.acciones} acciones | "
              f"pose final ({self.x:.2f},{self.y:.2f})")
        print(f"Reporte: minas.json + {salida}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sim", action="store_true", help="sin hardware, para probar la logica")
    args = ap.parse_args()

    m = Mision(sim=args.sim)
    try:
        if m.ir_a_meta():
            m.homing_baliza()
            m.escanear()
    finally:
        m.robot.terminar()
        if m.vision:
            m.vision.cerrar()
        m.reporte()


if __name__ == "__main__":
    main()
