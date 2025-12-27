import type { Request, Response } from "express";
import { EventService } from "../events/services/EventService.js";

export class WebhookController {
  async handle(req: Request, res: Response) {
    const body = req.body;

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({
        error: "Payload vazio ou inválido.",
      });
    }

    if (!body.type || !body.payload) {
      return res.status(400).json({
        error: "Campos obrigatórios: type e payload",
      });
    }

    try {
      const eventService = new EventService();

      const event = await eventService.createEvent({
        type: body.type,
        payload: body.payload,
      });

      return res.status(202).json({
        message: "Evento recebido com sucesso!",
        eventId: event.id,
      });
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      return res.status(500).json({
        error: "Erro interno ao processar o evento",
      });
    }
  }
}
