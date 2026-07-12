#!/usr/bin/env python3
"""Deteccion por color con la camara Raspberry (picamera2 + OpenCV).

La AI Camera (IMX500) funciona como camara normal con picamera2, asi que esto
sirve tanto para la baliza de la meta como para las "minas" de color.

Prueba en vivo (muestra que ve cada color definido en escenario.yaml):
    python3 vision.py
"""
import cv2
import numpy as np


class Vision:
    def __init__(self, colores, ancho=640, alto=480):
        """colores: dict nombre -> lista de rangos HSV [[lo, hi], ...] (de escenario.yaml)."""
        from picamera2 import Picamera2
        self.colores = colores
        self.picam = Picamera2()
        cfg = self.picam.create_video_configuration(
            main={"size": (ancho, alto), "format": "RGB888"})
        self.picam.configure(cfg)
        self.picam.start()

    def capturar(self):
        frame = self.picam.capture_array()          # RGB888 llega como BGR para OpenCV
        return frame

    def _mascara(self, frame, nombre):
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = np.zeros(hsv.shape[:2], np.uint8)
        for lo, hi in self.colores[nombre]:
            mask |= cv2.inRange(hsv, np.array(lo), np.array(hi))
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        return mask

    def detectar(self, nombre, area_min=400, frame=None):
        """Busca el blob mas grande del color dado.

        Devuelve (cx, area) o None. cx en [-1, 1]: 0 = centrado,
        negativo = a la izquierda de la imagen, positivo = a la derecha.
        """
        if frame is None:
            frame = self.capturar()
        mask = self._mascara(frame, nombre)
        contornos, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contornos:
            return None
        mayor = max(contornos, key=cv2.contourArea)
        area = cv2.contourArea(mayor)
        if area < area_min:
            return None
        M = cv2.moments(mayor)
        cx = (M["m10"] / M["m00"]) / frame.shape[1] * 2 - 1
        return cx, area

    def cerrar(self):
        self.picam.stop()


if __name__ == "__main__":
    import yaml
    with open("escenario.yaml") as f:
        colores = yaml.safe_load(f)["colores"]
    v = Vision(colores)
    print("Ctrl+C para salir. Acerca objetos de los colores configurados...")
    try:
        while True:
            frame = v.capturar()
            for nombre in colores:
                r = v.detectar(nombre, frame=frame)
                if r:
                    print(f"{nombre}: cx={r[0]:+.2f} area={r[1]:.0f}")
    except KeyboardInterrupt:
        v.cerrar()
