// src/modules/events/EventWorker.ts
import { EventProcessorService } from './EventProcessorService.js';

const INTERVAL_SECONDS = 10; // roda a cada 10 segundos, ajusta se quiser

async function runWorker() {
  try {
    await EventProcessorService.processPendingEvents();
  } catch (err) {
    console.error("Erro no worker:", err);
  }
}

// roda imediatamente
runWorker();

// roda a cada X segundos
setInterval(runWorker, INTERVAL_SECONDS * 1000);

