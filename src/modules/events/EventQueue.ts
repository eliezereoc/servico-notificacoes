import { Queue, type JobsOptions } from "bullmq";
import type { Event } from "@prisma/client";
import { redis } from "../../shared/infra/redis.js";

export const MAX_EVENT_ATTEMPTS = 5;
export const BACKOFF_DELAY_MS = 1000;
const QUEUE_NAME = "events";

const defaultJobOptions: JobsOptions = {
  attempts: MAX_EVENT_ATTEMPTS,
  backoff: {
    type: "exponential",
    delay: BACKOFF_DELAY_MS,
  },
  removeOnComplete: true,
};

export const eventQueue = new Queue<Event>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions,
});

export async function addEventToQueue(event: Event): Promise<void> {
  const attemptsLeft = Math.max(1, MAX_EVENT_ATTEMPTS - (event.attempts ?? 0));

  try {
    await eventQueue.add("process-event", event, {
      jobId: String(event.id),
      attempts: attemptsLeft,
      backoff: {
        type: "exponential",
        delay: BACKOFF_DELAY_MS,
      },
    });
    console.log(`📨 Evento ${event.id} enfileirado para processamento`);
  } catch (error: unknown) {
    const message = (error as Error)?.message ?? "Erro ao enfileirar";

    if (message.includes("already exists")) {
      console.log(`🔄 Job para evento ${event.id} já existe na fila, ignorando duplicação`);
      return;
    }

    throw error;
  }
}
