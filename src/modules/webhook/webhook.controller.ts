import type { Request, Response } from "express";

export class WebhookController {
  async handle(req: Request, res: Response) {
    const body = req.body;

    // Validação simples
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({
        error: "Payload vazio ou inválido.",
      });
    }

    // (PRÓXIMO PASSO) — aqui vamos salvar o evento na fila

    return res.status(202).json({
      message: "Evento recebido com sucesso!",
      recebido: body
    });
  }
}
