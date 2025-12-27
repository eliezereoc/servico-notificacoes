import { EventService } from "../services/EventService.js";

const eventService = new EventService();

export class EventController {
  async receive(req, res) {
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ error: "type e payload são obrigatórios" });
    }

    const event = await eventService.createEvent({ type, payload });

    return res.status(202).json({
      message: "Evento recebido com sucesso",
      eventId: event.id,
    });
  }
}
