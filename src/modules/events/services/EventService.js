import "dotenv/config";
import { PrismaClient, EventStatus } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não definida no ambiente");
}

// Prisma 7: usar driver adapter para MySQL/MariaDB
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

export class EventService {
  async createEvent({ type, payload }) {
    try {
      const event = await prisma.event.create({
        data: {
          type,
          payload,
          status: EventStatus.PENDING,
          attempts: 0,
        },
      });

      return event;
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      throw new Error("Não foi possível salvar o evento");
    }
  }
}
