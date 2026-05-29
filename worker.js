let fileHandle = null;
let accessHandle = null;
let measuring = false;
let timer = null;
let burstSize = 80;
let interval = 50;
let fileSize = 0;

onmessage = async function(e) {
  const data = e.data;
  
  if (data.type === 'INIT') {
    fileSize = data.totalBytes;
    await initOPFS(data.totalBytes);
  } else if (data.type === 'START') {
    burstSize = data.burstSize;
    interval = data.interval;
    fileSize = data.fileSize;
    measuring = true;
    measureStep();
  } else if (data.type === 'STOP') {
    measuring = false;
    if (timer) { clearTimeout(timer); timer = null; }
  } else if (data.type === 'CLEANUP') {
    await cleanup();
  } else if (data.type === 'UPDATE_PARAMS') {
    if (data.burstSize) burstSize = data.burstSize;
    if (data.interval) interval = data.interval;
  }
};

async function initOPFS(totalBytes) {
  try {
    postMessage({ type: 'LOG', msg: `Solicitando directorio OPFS raíz…` });
    const root = await navigator.storage.getDirectory();

    const totalMB = (totalBytes / 1048576).toFixed(0);
    postMessage({ type: 'LOG', msg: `Creando archivo de sonda (${totalMB} MB)…` });
    postMessage({ type: 'STATUS', text: 'Escribiendo…' });

    fileHandle = await root.getFileHandle('frost_probe.bin', { create: true });
    accessHandle = await fileHandle.createSyncAccessHandle();

    const chunkSize = 1024 * 1024;
    const buf = new ArrayBuffer(chunkSize);
    const view = new Uint8Array(buf);
    for (let i = 0; i < chunkSize; i++) view[i] = (i * 2654435761) & 0xFF;

    let written = 0;
    const writeChunk = () => {
      const toWrite = Math.min(chunkSize, totalBytes - written);
      if (toWrite <= 0) {
        accessHandle.flush();
        const actualMB = (accessHandle.getSize() / 1048576).toFixed(1);
        postMessage({ type: 'STATUS', text: 'Listo', actualMB: actualMB });
        postMessage({ type: 'LOG', msg: `✓ Archivo creado: ${actualMB} MB`, logType: 'ok' });
        postMessage({ type: 'LOG', msg: `OPFS listo. Pulsa "Iniciar medición".`, logType: 'ok' });
        postMessage({ type: 'INIT_DONE' });
        return;
      }
      accessHandle.write(buf.slice(0, toWrite), { at: written });
      written += toWrite;
      const pct = ((written / totalBytes) * 100).toFixed(0);
      postMessage({ type: 'STATUS', text: `Escribiendo ${pct}%` });
      setTimeout(writeChunk, 0);
    };
    writeChunk();
  } catch (e) {
    postMessage({ type: 'STATUS', text: 'Error' });
    postMessage({ type: 'LOG', msg: 'Error: ' + e.message, logType: 'err' });
    if (e.name === 'QuotaExceededError') {
      postMessage({ type: 'WARN', msg: '⚠ Sin espacio suficiente en disco. Prueba con un tamaño menor.' });
    } else {
      postMessage({ type: 'WARN', msg: '⚠ Error: ' + e.message + '. Asegúrate de servir desde localhost o HTTPS.' });
    }
    postMessage({ type: 'ERROR' });
  }
}

function sampleBurst(n, size) {
  if (!accessHandle) return [];
  const buf = new ArrayBuffer(4096);
  const results = [];
  for (let i = 0; i < n; i++) {
    const offset = Math.floor(Math.random() * (size - 4096));
    const t0 = performance.now();
    try { accessHandle.read(buf, { at: offset }); } catch (_) {}
    results.push(performance.now() - t0);
  }
  return results;
}

function measureStep() {
  if (!measuring) return;
  const samples = sampleBurst(burstSize, fileSize);
  if (samples.length) {
    postMessage({ type: 'MEASUREMENT', samples });
  }
  timer = setTimeout(measureStep, interval);
}

async function cleanup() {
  measuring = false;
  if (timer) { clearTimeout(timer); timer = null; }
  try {
    if (accessHandle) { accessHandle.close(); accessHandle = null; }
    if (fileHandle) {
      const root = await navigator.storage.getDirectory();
      await root.removeEntry('frost_probe.bin');
      fileHandle = null;
    }
    postMessage({ type: 'CLEANUP_DONE' });
  } catch (e) { 
    postMessage({ type: 'LOG', msg: 'Error al limpiar: ' + e.message, logType: 'err' }); 
  }
}
