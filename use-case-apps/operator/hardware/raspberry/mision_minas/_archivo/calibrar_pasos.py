#!/usr/bin/env python3
"""Calibracion del dead reckoning: cuanto avanza un paso y cuanto gira un giro.

Correr EN EL ROBOT, sobre la misma superficie del escenario:
    sudo python3 calibrar_pasos.py

Genera calibracion.json, que usa navegar.py.
"""
import json
import time

from picrawler import Picrawler

VELOCIDAD = 80
N_PASOS = 10
N_GIROS = 6
ANGULO_CMD = 30  # grados nominales por giro ('turn left angle')


def pedir_numero(msg):
    while True:
        try:
            return float(input(msg).replace(",", "."))
        except ValueError:
            print("Numero invalido, intenta de nuevo.")


def main():
    crawler = Picrawler()
    crawler.move_list.angle = ANGULO_CMD
    crawler.do_action("stand", 1, VELOCIDAD)
    time.sleep(1)

    print(f"\n== AVANCE ==\nMarca la posicion actual del robot. Va a dar {N_PASOS} pasos.")
    input("Enter para empezar...")
    for i in range(N_PASOS):
        crawler.do_action("forward", 1, VELOCIDAD)
        time.sleep(0.2)
    total_cm = pedir_numero(f"Distancia recorrida en {N_PASOS} pasos (cm): ")
    paso_m = total_cm / 100.0 / N_PASOS

    print(f"\n== GIRO ==\nMarca hacia donde mira el robot. Va a girar {N_GIROS} veces a la "
          f"izquierda ({ANGULO_CMD} grados nominales cada una = {N_GIROS * ANGULO_CMD} en teoria).")
    input("Enter para empezar...")
    for i in range(N_GIROS):
        crawler.do_action("turn left angle", 1, VELOCIDAD)
        time.sleep(0.2)
    total_deg = pedir_numero(f"Angulo total girado realmente (grados): ")
    giro_real_deg = total_deg / N_GIROS

    cal = {
        "paso_m": round(paso_m, 4),
        "giro_cmd_deg": ANGULO_CMD,
        "giro_real_deg": round(giro_real_deg, 2),
        "velocidad": VELOCIDAD,
    }
    with open("calibracion.json", "w") as f:
        json.dump(cal, f, indent=2)
    print(f"\nGuardado en calibracion.json: {cal}")
    print("Consejo: repite la medicion si el robot resbalo o se atasco.")

    crawler.do_action("sit", 1, 40)


if __name__ == "__main__":
    main()
