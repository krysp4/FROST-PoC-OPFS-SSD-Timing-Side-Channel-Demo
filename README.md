# FROST-PoC: OPFS SSD Timing Side-Channel Demo
> **Disclaimer:** Este proyecto es una Prueba de Concepto (PoC) creada estrictamente con **fines educativos y de investigación**. Demuestra la vulnerabilidad teórica de los ataques de canal lateral a través de sistemas de almacenamiento web. No incluye modelos de Machine Learning para desanonimizar tráfico o aplicaciones reales.
## 📝 Descripción Breve
Una demostración en JavaScript puro de cómo la API Origin Private File System (OPFS) puede ser explotada desde un navegador web moderno para medir con alta precisión la latencia de lectura de un disco SSD. Al monitorear las variaciones de esta latencia (contención I/O), se sientan las bases para ataques de canal lateral basados en tiempos, similares a los descritos en la investigación del ataque FROST.
## 🚀 Cómo funciona
1. **Archivo Sonda en OPFS:** El script crea un archivo binario grande (ej. 256 MB) en el disco del usuario utilizando la API de OPFS. Esto se hace en silencio, ya que OPFS no requiere solicitar permisos al usuario.
2. **Web Worker Dedicado:** Para no bloquear el hilo principal del navegador y poder usar el método `createSyncAccessHandle()` (necesario para la precisión síncrona), el ataque corre dentro de un Web Worker (`worker.js`).
3. **Medición de Latencia:** El Worker realiza ráfagas continuas de lecturas aleatorias de 4 KB midiendo el tiempo exacto que tarda cada una usando `performance.now()`.
4. **Detección de Contención:** Cuando otra aplicación en el ordenador del usuario (por ejemplo, abrir Photoshop, un juego o copiar archivos) usa el SSD, se produce un "cuello de botella" a nivel de hardware. El script detecta estos picos de latencia de lectura.
## 🧠 El salto al Ataque Real (No incluido)
En un ataque completo, esta sonda se usa para recopilar miles de gráficas de latencia. Cada programa genera una "huella dactilar" I/O única. Esos datos se pasarían luego a un modelo de Machine Learning (como una Red Neuronal Convolucional) entrenado previamente para inferir con gran precisión **qué aplicación exacta** está abriendo el usuario, rompiendo así la privacidad del sistema desde el navegador.
## ⚙️ Requisitos y Uso
- Navegador moderno compatible con OPFS y Web Workers (Chrome 102+, Safari 15.2+, Firefox 111+).
- **Debe servirse a través de contexto seguro**: `localhost` o `HTTPS` válido. OPFS no funciona en `file://` o HTTP puro (salvo localhost).
### Despliegue en Local
Puedes servir este proyecto rápidamente con Python o PHP.
```bash
# Con Python
python3 -m http.server 8000
# Visita http://localhost:8000
```
```bash
# Con PHP
php -S localhost:8000
# Visita http://localhost:8000
```
## 🗂️ Estructura del Código
- `index.html`: Interfaz de usuario, gráficas en tiempo real (Canvas) y motor de inferencia heurística simulada.
- `worker.js`: Web Worker encargado de gestionar OPFS, escribir el archivo sonda y realizar el bombardeo de lecturas síncronas.
