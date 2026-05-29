# FROST-PoC: OPFS SSD Timing Side-Channel Demo
> Disclaimer: Este proyecto es una Prueba de Concepto (PoC) creada estrictamente con fines educativos y de investigación. Demuestra la vulnerabilidad teórica de los ataques de canal lateral a través de sistemas de almacenamiento web. No incluye modelos de Machine Learning para desanonimizar tráfico o aplicaciones reales.
## Descripcion Breve
PoC educativo en JS que explota OPFS para medir la latencia SSD desde el navegador. Detecta picos de lectura I/O (contención), base de los ataques de canal lateral como FROST.
## Fundamento Tecnico
Este proyecto es una implementacion practica basada en investigaciones recientes de seguridad informatica (conocido como el ataque FROST). El concepto principal radica en que los discos SSD, al recibir peticiones de lectura simultaneas desde diferentes aplicaciones (por ejemplo, al abrir un programa pesado), sufren pequenos retrasos en su tiempo de respuesta (latencia). 
El estandar web moderno introdujo la API OPFS (Origin Private File System), que permite a las paginas web acceder al disco local del usuario con un rendimiento casi nativo. Esta prueba de concepto abusa de esta API para cronometrar, desde un entorno aislado en el navegador, cuanto tarda el disco en responder a lecturas constantes. Cuando la latencia se dispara temporalmente, el script deduce que el usuario acaba de iniciar otra aplicacion o proceso en su ordenador que esta consumiendo recursos del disco.
## Referencias y Noticias
Este PoC ilustra la vulnerabilidad documentada en los siguientes articulos:
- [Investigadores dicen que pueden espiar tu navegacion... (elHacker.net)](https://blog.elhacker.net/2026/05/investigadores-dicen-que-pueden-espiar.html)
- [Researchers say they can spy on your browsing... (Tom's Hardware)](https://www.tomshardware.com/tech-industry/cyber-security/researchers-say-they-can-spy-on-your-browsing-by-measuring-ssd-activity-through-a-browser-api)
## Como funciona (Arquitectura)
1. Archivo Sonda en OPFS: El script crea un archivo binario grande (ej. 256 MB) en el disco del usuario utilizando OPFS. Esta operacion es silenciosa y no requiere permisos ni interaccion por parte del usuario.
2. Web Worker Dedicado: El proceso de lectura intensiva se delega a un hilo secundario (worker.js) para poder utilizar `createSyncAccessHandle()`. Esto es obligatorio para hacer lecturas sincronas puras y obtener la maxima precision temporal posible sin que la interfaz grafica interfiera.
3. Medicion de Latencia: El worker realiza bloques de lecturas aleatorias sobre el archivo, midiendo el tiempo exacto de cada lectura mediante la funcion `performance.now()`.
4. Deteccion de Contencion: El hilo principal grafica la latencia y aplica una heuristica matematica. Si detecta conjuntos de lecturas inusualmente lentas, advierte de la actividad en disco de terceros. 
En el ataque malicioso real completo (FROST), estas latencias no se analizan con una regla estatica simple, sino que se envian a una Red Neuronal Convolucional (IA) preentrenada que es capaz de clasificar esos patrones temporales para deducir el nombre exacto de la aplicacion que abrio el usuario.
## Requisitos y Uso
- Navegador moderno compatible con OPFS y Web Workers (Chrome 102+, Safari 15.2+, Firefox 111+).
- Debe servirse a traves de contexto seguro: `localhost` o `HTTPS` valido (por restricciones de seguridad de OPFS).
Para iniciar la prueba localmente, ejecuta un servidor HTTP basico en el directorio del proyecto:
Con Python:
```bash
python3 -m http.server 8000
```
Luego visita http://localhost:8000
