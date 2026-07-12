#!/usr/bin/env python3
"""Grabador de ruta: teleopera el robot con el teclado y cada movimiento queda
grabado en ruta.json, que luego demo.py reproduce tal cual.

En el robot:   sudo python3 grabar.py
Prueba en PC:  python3 grabar.py --sim   (graba sin mover nada)

Teclas:
  W/S       adelante / atras
  A/D       giro fino (ANGULO_GIRO grados)   Q/E   giro grande (gait completo)
  P         grabar una pausa de 1 s          U     borrar el ultimo paso
  + / -     subir / bajar velocidad
  G         guardar ruta.json y salir        Ctrl+C  salir sin guardar
"""
import argparse
import json
import time

import readchar

SPEED_MIN, SPEED_MAX = 50, 90
ACTION_GAP = 0.25
ANGULO_GIRO = 15    # grados por giro fino (A/D). Bajar mas de ~10 ya no vale la pena:
                    # el robot resbala mas de lo que gira.

TECLAS = {
    "w": "forward",
    "s": "backward",
    "a": "turn left angle",     # giro fino, usa ANGULO_GIRO
    "d": "turn right angle",
    "q": "turn left",           # giro grande (gait fijo de la libreria)
    "e": "turn right",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sim", action="store_true", help="grabar sin robot")
    args = ap.parse_args()

    crawler = None
    if not args.sim:
        from picrawler import Picrawler
        crawler = Picrawler()
        crawler.move_list.angle = ANGULO_GIRO
        crawler.do_action("stand", 1, 70)
        time.sleep(0.5)

    velocidad = 70
    ruta = []

    def mostrar():
        print("\033[H\033[J", end="")
        print(__doc__)
        print(f"Velocidad: {velocidad} | Pasos grabados: {len(ruta)}")
        for p in ruta[-8:]:
            print("  ", p)

    mostrar()
    try:
        while True:
            key = readchar.readkey()
            k = key.lower()

            if k in TECLAS:
                accion = TECLAS[k]
                if crawler:
                    crawler.do_action(accion, 1, velocidad)
                    time.sleep(ACTION_GAP)
                paso = {"accion": accion, "velocidad": velocidad}
                if "angle" in accion:
                    paso["angulo"] = ANGULO_GIRO
                ruta.append(paso)
            elif k == "p":
                ruta.append({"accion": "pausa", "segundos": 1.0})
            elif k == "u" and ruta:
                ruta.pop()
            elif k in ("+", "]"):
                velocidad = min(SPEED_MAX, velocidad + 5)
            elif k in ("-", "["):
                velocidad = max(SPEED_MIN, velocidad - 5)
            elif k == "g":
                with open("ruta.json", "w") as f:
                    json.dump(ruta, f, indent=1)
                print(f"\nGuardado: ruta.json con {len(ruta)} pasos.")
                break
            elif key == readchar.key.CTRL_C:
                print("\nSalida sin guardar.")
                break
            mostrar()
    finally:
        if crawler:
            try:
                crawler.do_step("sit", 40)
                time.sleep(1)
            except Exception:
                pass


if __name__ == "__main__":
    main()
