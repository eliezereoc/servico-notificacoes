# Serviço de Notificações — API Node.js

## 🇧🇷 Versão em Português

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


## 🏁 Passos iniciais já implementados

1) Setup básico do projeto Node.js com Express, definição da arquitetura de pastas (routes, controllers, services, infra) e habilitação de ESM no `package.json` para manter imports nativos consistentes.
2) Instalação e configuração das dependências base (`express`, `cors`, `dotenv`) e criação do servidor inicial em TypeScript (`server.ts`), já com middleware de JSON e CORS habilitados.
3) Implementação da rota de Webhook para recebimento dos eventos do Sistema A (POST montado sob `/webhook`), validando payloads vazios ou inválidos e retornando 202 Accepted quando o corpo é aceito.
4) Instalação do Prisma ORM, execução do `prisma init`, ajuste do `.env` para apontar para MySQL e atualização do datasource no `schema.prisma` conforme o ambiente.
5) Criação do modelo `Event` no Prisma com o enum `EventStatus`, execução da migration e verificação da tabela no MySQL para garantir que o esquema esteja sincronizado com o banco.

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

## 🇺🇸 English Version

# Notifications Service — Node.js API

REST API to receive events via Webhook and trigger notification processing. Designed to be lightweight, straightforward, and ready for integration with external services (queue, retries, dead-letter) in future iterations.

## ✅ Prerequisites

Before you start, make sure you have:

- Node.js (version 18 or higher) — Download: https://nodejs.org/
- npm (included with Node.js)

To verify:

```
node --version
npm --version
```

## 🇺🇸 About the project

This service exposes a Webhook endpoint to receive JSON events and respond with 202 (Accepted), keeping coupling minimal. The processing module (queue, retries, DLQ) is expected to evolve next.

- Lightweight and scalable structure
- Module separation (webhook, processor)
- Consistent responses with basic payload validation
- Ready to integrate with messaging (RabbitMQ, SQS, etc.) later

## 🏁 Initial steps completed

1) Basic Node.js setup with Express, folder layout defined (routes, controllers, services, infra), and ESM enabled in `package.json` to keep native-style imports consistent.
2) Installed and configured the base dependencies (`express`, `cors`, `dotenv`) and created the initial server in TypeScript (`server.ts`) with JSON parsing and CORS enabled.
3) Implemented the Webhook route to receive events from System A (POST under `/webhook`), validating empty/invalid payloads and returning 202 Accepted when the body is accepted.
4) Installed Prisma ORM, ran `prisma init`, adjusted `.env` to point to MySQL, and updated the datasource in `schema.prisma` according to the environment.
5) Created the Prisma `Event` model with the `EventStatus` enum, ran the migration, and verified the table in MySQL to ensure the schema is in sync with the database.

## 📦 Technologies used

- Node.js
- Express
- CORS
- dotenv
- TypeScript (build/exec via `tsx`)

## 📁 Project structure

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

## 🔐 Authentication

Currently, the service does not require authentication for the published endpoints. For production environments, it is recommended to add signature verification, IP allowlist/denylist, and/or access tokens.

## 🔌 Main endpoints

### Root

- Method: GET
- Route: `/`
- Description: Checks if the service is up.
- Example response:

```
{
	"message": "Serviço de Notificações Ativo"
}
```

### Webhook

- Method: POST
- Route: `/webhook`
- Description: Receives a JSON payload. If empty or invalid, returns 400; if valid, returns 202 and echoes the received content.
- Body: free-form JSON
- Responses:
	- 202 Accepted: `{ message: "Evento recebido com sucesso!", recebido: { ... } }`
	- 400 Bad Request: `{ error: "Payload vazio ou inválido." }`

## 💡 Use cases

### Send an event to the Webhook

```
curl -X POST http://localhost:3333/webhook \
	-H "Content-Type: application/json" \
	-d '{
		"tipo": "pedido_criado",
		"dados": { "pedidoId": 123, "valor": 249.90 }
	}'
```

Expected response (202):

```
{
	"message": "Evento recebido com sucesso!",
	"recebido": {
		"tipo": "pedido_criado",
		"dados": { "pedidoId": 123, "valor": 249.90 }
	}
}
```

## ⚙️ How to run

### 1. Clone the repository

```
git clone <repository-url>
cd servico-notificacoes
```

### 2. Install dependencies

```
npm install
```

### 3. Configure environment variables

Create a `.env` file (optional) to set the server port:

```
PORT=3333
```

If you don’t set `PORT`, the service defaults to `3333`.

### 4. Run in development

```
npm run dev
```

Application available at:

```
http://localhost:3333
```

## 🔒 Security

- CORS enabled
- Basic payload validation on Webhook
- Production recommendations: HMAC signature, token auth, rate limiting, structured logs.

## 🤝 How to Contribute

1. Create a branch: `git checkout -b feature/your-feature`
2. Use semantic commits: `feat:`, `fix:`, `docs:`
3. Open a Pull Request describing the change

## 🛣️ Roadmap

- Persist events in queue (RabbitMQ/SQS)
- Retries and Dead-Letter Queue (DLQ)
- Observability (structured logs, metrics, tracing)
- Webhook signature and origin verification
- Rate limiting and abuse protection

## 👤 Author

Notifications Service Project

## 📄 License

ISC — see the `LICENSE` file for details.
