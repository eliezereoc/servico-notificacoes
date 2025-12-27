import { Router } from "express";
import { WebhookController } from "./webhook.controller.js";

const webhookRoutes = Router();
const webhookController = new WebhookController();

webhookRoutes.post("/", webhookController.handle);

export { webhookRoutes };
