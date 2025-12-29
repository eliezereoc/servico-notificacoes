import express from "express";
import cors from "cors";
import { router } from "./shared/http/routes/index.js";
import { startWorker } from "./modules/events/EventWorker.js";
import { EventService } from "./modules/events/services/EventService.js";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3333;

async function bootstrap() {
  startWorker();
  await EventService.requeuePendingEvents();

  app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta ${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("❌ Erro ao subir servidor:", error);
  process.exit(1);
});
