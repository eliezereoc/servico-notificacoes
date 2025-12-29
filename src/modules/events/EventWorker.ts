import axios from "axios";
import { Worker, type Job } from "bullmq";
import type { Event } from "@prisma/client";
import { EventStatus } from "@prisma/client";
import { prisma } from "../../shared/infra/prisma.js";
import { redis } from "../../shared/infra/redis.js";
import { MAX_EVENT_ATTEMPTS } from "./EventQueue.js";

const QUEUE_NAME = "events";
const CONCURRENCY = 5;
const REQUEST_TIMEOUT_MS = 10_000;

async function processJob(job: Job<Event>): Promise<unknown> {
  const eventId = job.data?.id;
  const sistemaBUrl = process.env.SISTEMA_B_URL;
  const sistemaBApiKey = process.env.SISTEMA_B_API_KEY;

  if (!eventId) {
    throw new Error("Job sem eventId para processar");
  }

  if (!sistemaBUrl) {
    throw new Error("SISTEMA_B_URL não configurada");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new Error(`Evento ${eventId} não encontrado para processamento`);
  }

  if (event.status === EventStatus.SUCCESS) {
    console.log(`✅ Evento ${eventId} já estava marcado como SUCCESS, ignorando`);
    return event.response ?? null;
  }

  if (event.status === EventStatus.FAILED) {
    console.log(`❌ Evento ${eventId} já estava marcado como FAILED, ignorando`);
    return event.response ?? null;
  }

  const currentAttempt = (event.attempts ?? 0) + 1;

  const startedAt = new Date();
  console.log(
    `⚙️  Processando evento ${eventId} (tentativa ${currentAttempt}/${MAX_EVENT_ATTEMPTS})`
  );

  try {
    const response = await axios.post(sistemaBUrl, event.payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": sistemaBApiKey ?? "",
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const responsePayload = response?.data ?? { status: response.status };

    await prisma.event.update({
      where: { id: eventId },
      data: {
        status: EventStatus.SUCCESS,
        attempts: currentAttempt,
        lastAttemptAt: startedAt,
        processedAt: new Date(),
        lastError: null,
        response: responsePayload,
      },
    });

    console.log(`✅ Evento ${eventId} enviado para Sistema B`);
    return responsePayload;
  } catch (error: unknown) {
    const errorMessage = axios.isAxiosError(error)
      ? error.response
        ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`
        : error.message
      : (error as Error)?.message ?? "Erro desconhecido";

    const hasAttemptsLeft = currentAttempt < MAX_EVENT_ATTEMPTS;

    await prisma.event.update({
      where: { id: eventId },
      data: {
        attempts: currentAttempt,
        lastAttemptAt: startedAt,
        lastError: errorMessage,
        status: hasAttemptsLeft ? EventStatus.PENDING : EventStatus.FAILED,
        failedAt: hasAttemptsLeft ? null : new Date(),
      },
    });

    console.error(
      `❌ Falha ao processar evento ${eventId} (tentativa ${currentAttempt}/${MAX_EVENT_ATTEMPTS}): ${errorMessage}`
    );

    throw error;
  }
}

let worker: Worker<Event> | null = null;

export function startWorker(): Worker<Event> {
  if (worker) {
    return worker;
  }

  worker = new Worker<Event>(QUEUE_NAME, processJob, {
    connection: redis,
    concurrency: CONCURRENCY,
  });

  worker.on("completed", (job) => {
    const attempt = job.attemptsMade + 1;
    console.log(`✅ Job ${job.id} concluído (tentativa ${attempt})`);
  });

  worker.on("failed", (job, err) => {
    const attempt = job?.attemptsMade ?? 0;
    const totalAttempts = job?.opts?.attempts ?? MAX_EVENT_ATTEMPTS;
    const willRetry = job ? attempt < totalAttempts : false;
    const emoji = willRetry ? "🔄" : "❌";

    console.error(
      `${emoji} Job ${job?.id ?? "desconhecido"} falhou (tentativa ${attempt}/${totalAttempts}): ${err?.message}`
    );

    if (willRetry) {
      console.log(
        `🔄 Reagendando job ${job?.id ?? "desconhecido"} para nova tentativa`
      );
    }
  });

  worker.on("error", (err) => {
    console.error("❌ Erro no worker:", err);
  });

  console.log("🚀 Worker BullMQ iniciado para a fila de eventos");
  return worker;
}
