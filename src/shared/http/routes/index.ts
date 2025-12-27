import { Router } from "express";
import { webhookRoutes } from "../../../modules/webhook/webhook.routes.js";

const router = Router();

router.use("/webhook", webhookRoutes);

router.get("/", (req, res) => {
  return res.json({ message: "Serviço de Notificações Ativo" });
});

export { router };
