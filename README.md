# Serviço de Notificações — API Node.js

REST API simples para receber eventos via Webhook e disparar processamento de notificações. Focada em ser leve, direta e pronta para integração com serviços externos (fila, reprocessamento, dead-letter) em versões futuras.

## ✅ Pré-requisitos

Antes de começar, garanta que você tem instalado:

- Node.js (versão 18 ou superior) — Download: https://nodejs.org/
- npm (incluído com Node.js)

Para verificar:

```
node --version
npm --version
```

## 🇧🇷 Sobre o projeto

Este serviço expõe um endpoint Webhook para receber eventos em JSON e retornar 202 (Accepted), mantendo o sistema acoplado de forma mínima. A ideia é que o módulo de processamento (fila, retentativas, DLQ) evolua em etapas seguintes.

- Estrutura leve e escalável
- Separação por módulos (webhook, processor)
- Respostas consistentes com validação básica do payload
- Pronto para integrar com mensageria (RabbitMQ, SQS, etc.) futuramente

## 📦 Tecnologias utilizadas

- Node.js
- Express
- CORS
- dotenv
- TypeScript (build/exec via `tsx`)

## 📁 Estrutura do projeto

```
servico-notificacoes/
├── LICENSE
├── package.json
├── README.md
├── tsconfig.json
└── src/
		├── server.ts
		├── modules/
		│   ├── processor/
		│   └── webhook/
		│       ├── webhook.controller.ts
		│       └── webhook.routes.ts
		└── shared/
				├── http/
				│   └── routes/
				│       └── index.ts
				└── infra/
						└── db/
```

## 🔐 Autenticação

Atualmente, o serviço não exige autenticação para os endpoints publicados. Em ambientes de produção, recomenda-se adicionar verificação de assinatura, IP allowlist/denylist, e/ou token de acesso.

## 🔌 Endpoints principais

### Raiz

- Método: GET
- Rota: `/`
- Descrição: Verifica se o serviço está ativo.
- Exemplo de resposta:

```
{
	"message": "Serviço de Notificações Ativo"
}
```

### Webhook

- Método: POST
- Rota: `/webhook`
- Descrição: Recebe um payload JSON. Se vazio ou inválido, retorna 400; caso válido, retorna 202 e ecoa o conteúdo recebido.
- Body: JSON livre
- Respostas:
	- 202 Accepted: `{ message: "Evento recebido com sucesso!", recebido: { ... } }`
	- 400 Bad Request: `{ error: "Payload vazio ou inválido." }`

## 💡 Casos de Uso

### Enviar evento para o Webhook

```
curl -X POST http://localhost:3333/webhook \
	-H "Content-Type: application/json" \
	-d '{
		"tipo": "pedido_criado",
		"dados": { "pedidoId": 123, "valor": 249.90 }
	}'
```

Resposta esperada (202):

```
{
	"message": "Evento recebido com sucesso!",
	"recebido": {
		"tipo": "pedido_criado",
		"dados": { "pedidoId": 123, "valor": 249.90 }
	}
}
```

## ⚙️ Como rodar o projeto

### 1. Clonar o repositório

```
git clone <url-do-repositorio>
cd servico-notificacoes
```

### 2. Instalar as dependências

```
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` (opcional) para definir a porta do servidor:

```
PORT=3333
```

Se não definir `PORT`, o serviço usa `3333` por padrão.

### 4. Rodar em desenvolvimento

```
npm run dev
```

Aplicação disponível em:

```
http://localhost:3333
```

## 🔒 Segurança

- CORS habilitado
- Validação básica de payload no Webhook
- Recomendações para produção: assinatura HMAC, autenticação por token, rate limiting, logs estruturados.

## 🤝 Como Contribuir

1. Crie uma branch: `git checkout -b feature/sua-feature`
2. Faça commits semânticos: `feat:`, `fix:`, `docs:`
3. Abra um Pull Request descrevendo a mudança

## 🛣️ Roadmap

- Persistir eventos em fila (RabbitMQ/SQS)
- Retentativas e Dead-Letter Queue (DLQ)
- Observabilidade (logs estruturados, métricas, tracing)
- Assinatura de Webhook e verificação de origem
- Política de rate limit e proteção contra abuso

## 👤 Autor

Projeto Serviço de Notificações

## 📄 Licença

ISC — veja o arquivo `LICENSE` para detalhes.

# servico-notificacoes
Serviço de Notificações
