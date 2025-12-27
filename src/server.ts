import express from "express";
import cors from "cors";
import { router } from "./shared/http/routes/index.js";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando na porta ${PORT}`);
});
