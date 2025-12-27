import { Router } from "express";
import { WebhookController } from "./webhook.controller.js";

const webhookRoutes = Router();
const webhookController = new WebhookController();

// Rota final ficará: /webhook/events
webhookRoutes.post("/events", (req, res) =>
  webhookController.handle(req, res)
);

export { webhookRoutes };
