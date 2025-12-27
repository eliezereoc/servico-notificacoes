import { EventStatus } from "@prisma/client";
import { prisma } from "../../shared/infra/prisma.js";

// Configurações do retry
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000; // 1 segundo

export class EventProcessorService {
  
  // Processa eventos pendentes
  static async processPendingEvents() {
    const events = await prisma.event.findMany({
      where: { status: EventStatus.PENDING },
      orderBy: { createdAt: "asc" }
    });

    for (const event of events) {
      await this.processEventWithRetry(event);
    }
  }

  // Processa um evento com retry + backoff exponencial
  private static async processEventWithRetry(event: any) {
    let attempt = event.attempts;
    let success = false;

    while (attempt < MAX_ATTEMPTS && !success) {
      try {
        // Aqui você chama sua lógica de processamento
        await this.handleEvent(event);

        // Se deu certo
        await prisma.event.update({
          where: { id: event.id },
          data: { status: EventStatus.SUCCESS, attempts: attempt + 1 }
        });
        success = true;

      } catch (error: any) {
        attempt++;
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1); // exponencial
        console.error(`Erro no evento ${event.id}, tentativa ${attempt}:`, error.message);
        await prisma.event.update({
          where: { id: event.id },
          data: { attempts: attempt, lastAttemptAt: new Date(), lastError: error.message }
        });

        if (attempt < MAX_ATTEMPTS) {
          await new Promise(res => setTimeout(res, delay));
        } else {
          await prisma.event.update({
            where: { id: event.id },
            data: { status: EventStatus.FAILED }
          });
        }
      }
    }
  }

  // Sua lógica real de processamento
  private static async handleEvent(event: any) {
    // Exemplo: processa payload
    console.log("Processando evento:", event.id, event.payload);
    // Aqui você pode colocar chamada a API, envio de email, etc.
    // Se algo der errado, lance um erro: throw new Error("Falha!");
  }
}
