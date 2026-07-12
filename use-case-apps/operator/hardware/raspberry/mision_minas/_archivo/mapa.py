#!/usr/bin/env python3
"""Mapa 2D del escenario (contorno poligonal + obstaculos) y planificador A*.

Uso directo:   python3 mapa.py     -> genera grid.png para inspeccionar el mapa
Como modulo:   from mapa import Mapa
"""
import heapq
import math

import cv2
import numpy as np
import yaml


class Mapa:
    def __init__(self, ruta_yaml="escenario.yaml"):
        with open(ruta_yaml) as f:
            self.esc = yaml.safe_load(f)

        env = self.esc["escenario"]["envolvente"]
        self.res = float(self.esc["escenario"].get("resolucion", 0.05))
        self.radio_robot = float(self.esc["escenario"].get("radio_robot", 0.15))
        self.ancho, self.largo = float(env[0]), float(env[1])
        self.cols = int(round(self.ancho / self.res))
        self.rows = int(round(self.largo / self.res))
        self._construir()

    # ---- conversion mundo (metros) <-> celda (fila, columna) ----

    def a_celda(self, x, y):
        col = min(self.cols - 1, max(0, int(x / self.res)))
        row = min(self.rows - 1, max(0, self.rows - 1 - int(y / self.res)))
        return row, col

    def a_mundo(self, row, col):
        return (col + 0.5) * self.res, (self.rows - 1 - row + 0.5) * self.res

    def _poly_px(self, puntos):
        return np.array([self.a_celda(x, y)[::-1] for x, y in puntos], np.int32)

    # ---- construccion del grid ----

    def _construir(self):
        libre = np.zeros((self.rows, self.cols), np.uint8)
        contorno = self.esc["escenario"].get("contorno")
        if contorno:
            cv2.fillPoly(libre, [self._poly_px(contorno)], 255)
        else:
            libre[:] = 255

        for obs in self.esc.get("obstaculos", []):
            if obs["tipo"] == "caja":
                r0, c0 = self.a_celda(obs["x"], obs["y"] + obs["largo"])
                r1, c1 = self.a_celda(obs["x"] + obs["ancho"], obs["y"])
                cv2.rectangle(libre, (c0, r0), (c1, r1), 0, -1)
            elif obs["tipo"] == "cilindro":
                r, c = self.a_celda(obs["x"], obs["y"])
                cv2.circle(libre, (c, r), int(round(obs["radio"] / self.res)), 0, -1)

        # Inflar lo ocupado con el radio del robot: asi A* puede tratarlo como un punto
        k = 2 * int(math.ceil(self.radio_robot / self.res)) + 1
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
        self.grid_libre = cv2.erode(libre, kernel) > 0

    def es_libre(self, x, y):
        return bool(self.grid_libre[self.a_celda(x, y)])

    def marcar_obstaculo(self, x, y, radio=0.10):
        """Registra un obstaculo detectado en vivo (ultrasonido) ya inflado."""
        img = self.grid_libre.astype(np.uint8) * 255
        r, c = self.a_celda(x, y)
        cv2.circle(img, (c, r), int(math.ceil((radio + self.radio_robot) / self.res)), 0, -1)
        self.grid_libre = img > 0

    # ---- A* ----

    def planificar(self, origen, destino):
        """Ruta de origen a destino (metros). Devuelve waypoints [(x,y), ...] o None."""
        ini = self._asegurar_libre(self.a_celda(*origen))
        fin = self._asegurar_libre(self.a_celda(*destino))
        if ini is None or fin is None:
            return None
        ruta = self._a_star(ini, fin)
        if ruta is None:
            return None
        ruta = self._simplificar(ruta)
        return [self.a_mundo(r, c) for r, c in ruta[1:]] or [self.a_mundo(*fin)]

    def _asegurar_libre(self, celda):
        """Si la celda cae en zona ocupada (p.ej. por la inflacion), busca la libre mas cercana."""
        if self.grid_libre[celda]:
            return celda
        for radio in range(1, max(self.rows, self.cols)):
            for dr in range(-radio, radio + 1):
                for dc in range(-radio, radio + 1):
                    if max(abs(dr), abs(dc)) != radio:
                        continue
                    r, c = celda[0] + dr, celda[1] + dc
                    if 0 <= r < self.rows and 0 <= c < self.cols and self.grid_libre[r, c]:
                        return r, c
        return None

    def _a_star(self, ini, fin):
        vecinos = [(-1, 0, 1), (1, 0, 1), (0, -1, 1), (0, 1, 1),
                   (-1, -1, 1.414), (-1, 1, 1.414), (1, -1, 1.414), (1, 1, 1.414)]
        h = lambda c: math.hypot(c[0] - fin[0], c[1] - fin[1])
        g = {ini: 0.0}
        came = {}
        abierto = [(h(ini), ini)]
        cerrado = set()
        while abierto:
            _, cur = heapq.heappop(abierto)
            if cur == fin:
                ruta = [fin]
                while ruta[-1] != ini:
                    ruta.append(came[ruta[-1]])
                return ruta[::-1]
            if cur in cerrado:
                continue
            cerrado.add(cur)
            for dr, dc, w in vecinos:
                nb = (cur[0] + dr, cur[1] + dc)
                if not (0 <= nb[0] < self.rows and 0 <= nb[1] < self.cols):
                    continue
                if not self.grid_libre[nb]:
                    continue
                ng = g[cur] + w
                if ng < g.get(nb, math.inf):
                    g[nb] = ng
                    came[nb] = cur
                    heapq.heappush(abierto, (ng + h(nb), nb))
        return None

    def _visible(self, a, b):
        n = max(abs(b[0] - a[0]), abs(b[1] - a[1]), 1)
        for i in range(n + 1):
            r = round(a[0] + (b[0] - a[0]) * i / n)
            c = round(a[1] + (b[1] - a[1]) * i / n)
            if not self.grid_libre[r, c]:
                return False
        return True

    def _simplificar(self, ruta):
        """Poda por linea de vista: se queda solo con los waypoints necesarios."""
        out = [ruta[0]]
        i = 0
        while i < len(ruta) - 1:
            j = len(ruta) - 1
            while j > i + 1 and not self._visible(ruta[i], ruta[j]):
                j -= 1
            out.append(ruta[j])
            i = j
        return out

    # ---- visualizacion ----

    def dibujar(self, ruta=None, trayectoria=None, minas=None, salida="grid.png", escala=8):
        img = np.full((self.rows, self.cols, 3), 40, np.uint8)
        img[self.grid_libre] = (235, 235, 235)
        img = cv2.resize(img, (self.cols * escala, self.rows * escala),
                         interpolation=cv2.INTER_NEAREST)

        def px(x, y):
            r, c = self.a_celda(x, y)
            return (c * escala + escala // 2, r * escala + escala // 2)

        if ruta:
            pts = [px(*p) for p in ruta]
            for a, b in zip(pts, pts[1:]):
                cv2.line(img, a, b, (255, 160, 0), 2)
        if trayectoria:
            for (x, y, _) in trayectoria:
                cv2.circle(img, px(x, y), 2, (180, 80, 200), -1)
        if minas:
            for m in minas:
                cv2.drawMarker(img, px(m["x"], m["y"]), (0, 0, 255),
                               cv2.MARKER_TILTED_CROSS, 14, 3)

        ix, iy, _ = self.esc["inicio"]
        cv2.circle(img, px(ix, iy), 6, (0, 200, 0), -1)
        cv2.circle(img, px(*self.esc["meta"]), 6, (0, 0, 200), -1)
        cv2.imwrite(salida, img)
        return salida


if __name__ == "__main__":
    m = Mapa()
    ini = m.esc["inicio"][:2]
    ruta = m.planificar(ini, m.esc["meta"])
    if ruta is None:
        print("SIN RUTA: revisa que inicio y meta esten dentro del contorno y fuera de obstaculos")
    else:
        print(f"Ruta con {len(ruta)} waypoints:")
        for x, y in ruta:
            print(f"  ({x:.2f}, {y:.2f})")
    print("Mapa guardado en", m.dibujar(ruta=ruta))
