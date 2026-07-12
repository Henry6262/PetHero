# Demo PiCrawler: ruta grabada + escaneo de minas + monitoreo web

Flujo de la demo:

1. **Grabar la ruta** una vez, teleoperando el robot (`grabar.py` → `ruta.json`).
2. **Reproducir** (`demo.py`): el robot repite la ruta transmitiendo video en vivo
   (sin detectar nada durante el trayecto).
3. Al terminar la ruta **activa la detección de minas** (objetos amarillos).
4. El **sitio web** (servido por la misma Pi) muestra el video y recibe cada
   detección al instante.

Video: **MJPEG** sobre HTTP (lo mismo que usan los ejemplos de SunFounder; el
navegador lo muestra nativo, latencia baja en LAN). Detecciones: **Server-Sent
Events** (push en tiempo real como un websocket, pero sin dependencias extra).

## Pasar el código del laptop a la Pi (por SSH)

```bash
# primera vez
scp -r mision_minas pi@<IP-DE-LA-PI>:~/

# cada vez que edites en el laptop (sincroniza solo lo cambiado)
rsync -av mision_minas/ pi@<IP-DE-LA-PI>:~/mision_minas/
```

(usuario y IP según su Pi; la IP se ve con `hostname -I` en la Pi o en el router)

## Instalar dependencias en la Pi (una vez)

```bash
sudo apt install python3-flask python3-opencv python3-numpy python3-picamera2
```

(`picrawler`, `robot_hat` y `readchar` ya están instalados con el kit)

## Uso

```bash
# 1. En la Pi: grabar la ruta manejando con WASD (P=pausa, U=deshacer, G=guardar)
cd ~/mision_minas
sudo python3 grabar.py

# 2. En la Pi: correr la demo
sudo python3 demo.py

# 3. En cualquier equipo de la misma red: abrir el dashboard
#    http://<IP-DE-LA-PI>:8000
```

Prueba sin robot (en el laptop, usa la webcam): `python3 demo.py --sim`

## Ajustes (constantes al inicio de demo.py)

- `DURACION_ESCANEO_S` — cuánto tiempo escanea al final (90 s por defecto).
- `AMARILLO_HSV` — rango del color mina; si la luz cambia y no detecta,
  bajar S/V mínimos (p. ej. `[20, 80, 80]`).
- `AREA_MINIMA` — sube si detecta falsos positivos pequeños.
- `PUERTO` — puerto del dashboard (8000).

## Consejos para la demo

- Graben la ruta **sobre la superficie real**: el robot repite acciones, no
  posiciones, así que si la superficie cambia el resultado cambia.
- Marquen con cinta la posición y orientación inicial del robot: la
  reproducción solo es fiel si arranca exactamente igual que al grabar.
- Prueben la detección de amarillo con la luz del lugar de la demo (fase
  "escaneando" muestra los recuadros rojos en el video en vivo).

La carpeta `_archivo/` guarda la versión anterior (navegación autónoma con
mapa + A*), por si la retoman.
