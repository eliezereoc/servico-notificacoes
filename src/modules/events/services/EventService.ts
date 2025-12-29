import type { Event } from "@prisma/client";
import { EventStatus } from "@prisma/client";
import { prisma } from "../../../shared/infra/prisma.js";
import { MAX_EVENT_ATTEMPTS, addEventToQueue } from "../EventQueue.js";

export class EventService {
  async createEvent({ type, payload }: { type: string; payload: unknown }): Promise<Event> {
    try {
      const event = await prisma.event.create({
        data: {
          type,
          payload,
          status: EventStatus.PENDING,
          attempts: 0,
        },
      });

      await addEventToQueue(event);
      console.log(`📨 Evento ${event.id} criado e enviado para a fila`);
      return event;
    } catch (error) {
      console.error("❌ Erro ao salvar evento:", error);
      throw new Error("Não foi possível salvar o evento");
    }
  }

  static async requeuePendingEvents(): Promise<void> {
    try {
      const pendingEvents = await prisma.event.findMany({
        where: {
          status: EventStatus.PENDING,
          attempts: {
            lt: MAX_EVENT_ATTEMPTS,
          },
        },
        orderBy: { createdAt: "asc" },
      });

      if (pendingEvents.length === 0) {
        console.log("⚙️  Nenhum evento pendente para reenfileirar");
        return;
      }

      console.log(`🔄 Reenfileirando ${pendingEvents.length} evento(s) pendente(s)`);
      for (const event of pendingEvents) {
        await addEventToQueue(event);
      }
    } catch (error) {
      console.error("❌ Erro ao reenfileirar eventos pendentes:", error);
      throw error;
    }
  }
}
