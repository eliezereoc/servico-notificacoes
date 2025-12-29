import { EventStatus } from "@prisma/client";
import { prisma } from "../../shared/infra/prisma.js";
import axios, { AxiosError } from "axios";

// Configurações do retry
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000; // 1 segundo
const REQUEST_TIMEOUT_MS = 30000; // 30 segundos timeout para requisições

// URL do sistema B (configure no .env)
const SYSTEM_B_URL = process.env.SYSTEM_B_URL || "http://localhost:4000/api/webhook";

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

  // Envia o evento para o sistema B
  private static async handleEvent(event: any) {
    console.log(`[EventProcessor] Enviando evento ${event.id} para sistema B...`);

    try {
      const response = await axios.post(
        SYSTEM_B_URL,
        {
          eventId: event.id,
          eventType: event.eventType,
          payload: event.payload,
          createdAt: event.createdAt
        },
        {
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            "Content-Type": "application/json",
            // Adicione autenticação se necessário
            // "Authorization": `Bearer ${process.env.SYSTEM_B_TOKEN}`
          }
        }
      );

      console.log(`[EventProcessor] Evento ${event.id} processado com sucesso. Status: ${response.status}`);
      
      // Atualiza o evento com informações de processamento
      await prisma.event.update({
        where: { id: event.id },
        data: { processedAt: new Date() }
      });

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Timeout
        if (axiosError.code === "ECONNABORTED") {
          throw new Error(`Timeout ao conectar com sistema B após ${REQUEST_TIMEOUT_MS}ms`);
        }
        
        // Erro de rede/conexão
        if (axiosError.code === "ECONNREFUSED" || axiosError.code === "ENOTFOUND") {
          throw new Error(`Falha ao conectar com sistema B: ${axiosError.message}`);
        }
        
        // Resposta com erro do servidor
        if (axiosError.response) {
          const status = axiosError.response.status;
          const data = axiosError.response.data;
          throw new Error(`Sistema B retornou erro ${status}: ${JSON.stringify(data)}`);
        }
        
        // Erro de requisição sem resposta
        throw new Error(`Erro na requisição para sistema B: ${axiosError.message}`);
      }
      
      // Outros tipos de erro
      throw new Error(`Erro inesperado ao processar evento: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
