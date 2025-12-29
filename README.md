# Serviço de Notificações — API Node.js

---

## 🇧🇷 Versão em Português

REST API simples para receber eventos via Webhook e disparar processamento de notificações. Focada em ser leve, direta e pronta para integração com serviços externos (fila, reprocessamento, dead-letter) em versões futuras.

### Sobre o projeto

Este serviço expõe um endpoint Webhook para receber eventos em JSON e retornar 202 (Accepted), mantendo o sistema acoplado de forma mínima. Desenvolvido com arquitetura modular, separação de responsabilidades e pronto para evoluir com componentes de processamento assíncrono.

**Características principais:**
- API leve e escalável
- Separação de módulos (webhook, processor)
- Respostas consistentes com validação básica de payload
- Pronto para integração com fila de mensagens (RabbitMQ, SQS, etc.)
- Persistência com Prisma ORM e MySQL

---

## ✅ Pré-requisitos

Antes de começar, garanta que você tem instalado:

- **Node.js** (versão 18 ou superior) — Download: https://nodejs.org/
- **npm** (incluído com Node.js)
- **MySQL** (versão 5.7 ou superior) — Download: https://www.mysql.com/
- **Git** (opcional, para clonar o repositório)

Para verificar as versões instaladas:

```bash
node --version
npm --version
mysql --version
```

---

## 📦 Tecnologias utilizadas

| Tecnologia | Versão | Descrição |
|---|---|---|
| Node.js | 18+ | Runtime JavaScript |
| Express | Latest | Framework web minimalista |
| TypeScript | Latest | Superset tipado de JavaScript |
| Prisma | Latest | ORM type-safe para Node.js |
| MySQL | 5.7+ | Banco de dados relacional |
| CORS | Latest | Middleware para controle de origem |
| dotenv | Latest | Gerenciamento de variáveis de ambiente |
| tsx | Latest | Executor TypeScript direto |

---

## 📁 Estrutura do projeto

```
servico-notificacoes/
├── LICENSE
├── package.json
├── tsconfig.json
├── prisma.config.ts
├── README.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20251227205631_create_event_table/
│           └── migration.sql
└── src/
    ├── server.ts                    # Ponto de entrada da aplicação
    ├── modules/
    │   ├── events/
    │   │   ├── controllers/
    │   │   │   └── EventController.js
    │   │   ├── services/
    │   │   │   └── EventService.js
    │   │   └── infra/
    │   ├── processor/
    │   │   ├── event.queue.ts      # Fila de processamento
    │   │   ├── EventProcessorService.ts
    │   │   └── EventWorker.ts
    │   └── webhook/
    │       ├── webhook.controller.ts
    │       └── webhook.routes.ts
    └── shared/
        ├── http/
        │   └── routes/
        │       └── index.ts
        └── infra/
            ├── prisma.ts           # Cliente Prisma
            └── db/
```

**Estrutura em detalhes:**

- **prisma/**: Configurações Prisma, schema do banco e migrations
- **src/server.ts**: Inicializa o Express, middleware e rotas
- **src/modules/webhook/**: Recebe eventos via HTTP e valida
- **src/modules/processor/**: Processa eventos em background
- **src/modules/events/**: Lógica de negócio para eventos
- **src/shared/infra/**: Configuração de banco de dados

---

## 🔌 Endpoints principais

### Root - Verificar se o serviço está ativo

**Método:** `GET`  
**Rota:** `/`  
**Descrição:** Verifica o status da aplicação  
**Autenticação:** Não requerida  

**Exemplo de requisição:**
```bash
curl http://localhost:3333/
```

**Resposta esperada (200):**
```json
{
  "message": "Serviço de Notificações Ativo"
}
```

---

### Webhook - Receber eventos

**Método:** `POST`  
**Rota:** `/webhook`  
**Descrição:** Recebe um payload JSON com os dados do evento. Se vazio ou inválido, retorna 400; se válido, retorna 202 e persiste o evento.  
**Autenticação:** Não requerida (será adicionada em versões futuras)  
**Content-Type:** `application/json`

**Parâmetros do body:**
```json
{
  "tipo": "string",              // Tipo do evento (ex: "pedido_criado")
  "dados": "object",             // Dados adicionais do evento
  "timestamp": "ISO8601 (opcional)"
}
```

**Exemplo de requisição:**
```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "pedido_criado",
    "dados": {
      "pedidoId": 123,
      "clienteId": 45,
      "valor": 249.90,
      "itens": [
        { "produtoId": 1, "quantidade": 2, "preco": 99.90 }
      ]
    }
  }'
```

**Respostas possíveis:**

- **202 Accepted** (Sucesso):
```json
{
  "message": "Evento recebido com sucesso!",
  "recebido": {
    "tipo": "pedido_criado",
    "dados": { "pedidoId": 123, "valor": 249.90 }
  }
}
```

- **400 Bad Request** (Erro):
```json
{
  "error": "Payload vazio ou inválido."
}
```

---

## 💡 Casos de Uso

### Caso 1: Sistema de Pedidos dispara notificação de novo pedido

Um sistema de e-commerce cria um pedido e precisa notificar o cliente e o setor de logística.

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "pedido_criado",
    "dados": {
      "pedidoId": "PED-2025-001",
      "clienteId": 789,
      "email": "cliente@example.com",
      "valor": 1299.99,
      "itens": 3
    }
  }'
```

**Fluxo esperado:**
1. Webhook recebe e valida o payload
2. Evento é armazenado no banco com status `PENDENTE`
3. Resposta 202 é enviada imediatamente ao cliente
4. Processor pega o evento da fila
5. Notificações são disparadas (email, SMS, webhook externo, etc.)

---

### Caso 2: Sistema de Pagamentos dispara confirmação

Um gateway de pagamento notifica sobre transação aprovada.

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "pagamento_aprovado",
    "dados": {
      "transacaoId": "TRX-987654",
      "pedidoId": "PED-2025-001",
      "valor": 1299.99,
      "metodo": "cartao_credito"
    }
  }'
```

---

### Caso 3: Sistema de Inventário dispara alerta

Estoque crítico de um produto.

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "estoque_critico",
    "dados": {
      "produtoId": 456,
      "nome": "Produto XYZ",
      "estoque": 2,
      "minimo": 10
    }
  }'
```

---

## 📊 Fluxo Completo de Uso

```
┌─────────────────────┐
│   Sistema Externo   │
│  (E-commerce,       │
│   Gateway, etc)     │
└──────────┬──────────┘
           │
           │ 1. POST /webhook
           │ (evento em JSON)
           ▼
┌─────────────────────┐
│  Webhook Receiver   │
│ (webhook.routes)    │
└──────────┬──────────┘
           │
           │ 2. Validação
           │    de payload
           ▼
┌─────────────────────┐
│  EventController    │
│ (valida entrada)    │
└──────────┬──────────┘
           │
           │ 3. Persiste
           │    evento
           ▼
┌─────────────────────┐
│  Banco de Dados     │
│  (MySQL + Prisma)   │
│  Status: PENDENTE   │
└──────────┬──────────┘
           │
           │ 4. Retorna 202
           │    (Accepted)
           ▼
┌─────────────────────┐
│  Cliente / Sistema  │
│  Externo (Callback) │
└─────────────────────┘

┌─────────────────────┐
│ EventProcessor      │
│ (Poll da fila)      │
└──────────┬──────────┘
           │
           │ 5. Busca eventos
           │    com status PENDENTE
           ▼
┌─────────────────────┐
│  Banco de Dados     │
└──────────┬──────────┘
           │
           │ 6. Evento encontrado
           │
           ▼
┌─────────────────────┐
│ EventProcessorSvc   │
│ (Processa evento)   │
└──────────┬──────────┘
           │
           │ 7. Executa ações
           │    (email, SMS, webhook)
           │
           ├─► Enviador de Email
           ├─► Enviador de SMS
           └─► Chamada Webhook
           │
           ▼
┌─────────────────────┐
│  Banco de Dados     │
│  Status: PROCESSADO │
│  processed_at: now  │
└─────────────────────┘
```

**Resumo do fluxo:**
1. Sistema externo envia evento via POST para `/webhook`
2. Validação e armazenamento no banco (status: PENDENTE)
3. Resposta 202 imediata ao cliente
4. Processor busca eventos pendentes
5. Processa e atualiza status (PROCESSADO ou ERRO)
6. Registra timestamp e detalhes de erro se houver

---

## ⚙️ Como rodar o projeto

### Passo 1: Clonar o repositório

```bash
git clone <url-do-repositorio>
cd servico-notificacoes
```

### Passo 2: Instalar as dependências

```bash
npm install
```

Isso instalará todas as dependências listadas em `package.json`:
- express (servidor HTTP)
- prisma (ORM)
- cors (middleware)
- dotenv (variáveis de ambiente)
- tsx (executor TypeScript)
- e outras...

### Passo 3: Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Porta do servidor
PORT=3333

# Banco de Dados MySQL
DATABASE_URL="mysql://usuario:senha@localhost:3306/servico_notificacoes"

# Ambiente
NODE_ENV=development
```

**Explicação dos campos:**
- `PORT`: Porta onde o servidor rodará (padrão: 3333)
- `DATABASE_URL`: String de conexão MySQL (formato: `mysql://user:password@host:port/database`)
- `NODE_ENV`: Ambiente de execução (development/production)

Se não definir variáveis, os padrões são usados:
- `PORT=3333`
- `DATABASE_URL=mysql://root:@localhost:3306/servico_notificacoes`

---

### Passo 4: Configurar o banco de dados

**4.1: Criar o banco de dados MySQL**

Acesse o MySQL CLI e crie o banco:

```bash
mysql -u root -p
```

No prompt MySQL:
```sql
CREATE DATABASE servico_notificacoes;
```

**4.2: Executar as migrations do Prisma**

As migrations criarão as tabelas automaticamente:

```bash
npx prisma migrate dev
```

Isso executará todos os arquivos em `prisma/migrations/` e sincronizará o schema com o banco.

**Alternativa (criar do zero):**
```bash
npx prisma generate
```

**Verificar o banco (opcional):**
```bash
mysql -u root -p servico_notificacoes
```

```sql
SHOW TABLES;
DESCRIBE events;
```

---

### Passo 5: Rodar o servidor

**Modo desenvolvimento (com recarregamento automático):**

```bash
npm run dev
```

**Modo produção:**

```bash
npm run build
npm run start
```

O servidor iniciará em:
```
http://localhost:3333
```

Você verá logs no console:
```
🚀 Servidor rodando em http://localhost:3333
```

---

## 🧪 Testar a aplicação

### Teste 1: Health Check

```bash
curl http://localhost:3333/
```

**Resposta esperada:**
```json
{
  "message": "Serviço de Notificações Ativo"
}
```

---

### Teste 2: Enviar evento válido

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "pedido_criado",
    "dados": { "pedidoId": 123, "valor": 99.90 }
  }'
```

**Resposta esperada (202):**
```json
{
  "message": "Evento recebido com sucesso!",
  "recebido": {
    "tipo": "pedido_criado",
    "dados": { "pedidoId": 123, "valor": 99.90 }
  }
}
```

---

### Teste 3: Enviar payload vazio

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resposta esperada (400):**
```json
{
  "error": "Payload vazio ou inválido."
}
```

---

## 🔒 Segurança

### Implementado

- ✅ CORS habilitado
- ✅ Validação básica de payload
- ✅ Tipos TypeScript para type-safety

### Recomendações para Produção

- 🔐 Implementar autenticação JWT
- 🔐 Adicionar assinatura HMAC para webhooks
- 🔐 IP allowlist/denylist
- 🔐 Rate limiting (throttling)
- 🔐 Logs estruturados e auditoria
- 🔐 Criptografia de dados sensíveis
- 🔐 HTTPS/TLS obrigatório

---

## 🤝 Como Contribuir

1. **Fork** o repositório

2. **Crie uma branch** para sua feature:
```bash
git checkout -b feature/sua-feature
git checkout -b fix/seu-bug
```

3. **Commit com mensagens semânticas:**
```bash
git commit -m "feat: adiciona nova funcionalidade"
git commit -m "fix: corrige bug na validação"
git commit -m "docs: atualiza README"
```

**Prefixos recomendados:**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação (sem mudança de lógica)
- `refactor:` - Refatoração de código
- `test:` - Testes
- `chore:` - Atualizações de dependências

4. **Push** para a branch:
```bash
git push origin feature/sua-feature
```

5. **Abra um Pull Request** descrevendo:
   - O que foi mudado
   - Por que foi mudado
   - Como testar

---

## 🛣️ Roadmap

### Fase 1: Segurança & Autenticação

- [ ] **Autenticação JWT** - Tokens JWT para endpoints protegidos
- [ ] **Validação de Webhook com HMAC** - Assinatura de requests
- [ ] **Rate Limiting** - Proteção contra abuso (throttling por IP)
- [ ] **API Key Management** - Sistema de chaves de API

### Fase 2: Documentação & Observabilidade

- [ ] **Documentação Swagger/OpenAPI** - Spec interativa dos endpoints
- [ ] **Logs Estruturados** - Implementar pino/winston com JSON
- [ ] **Métricas Prometheus** - Exportar métricas para monitoramento
- [ ] **Distributed Tracing** - Jaeger/Zipkin para rastrear requisições

### Fase 3: Processamento Assíncrono

- [ ] **Fila de Mensagens (RabbitMQ/SQS)** - Desacoplamento de processamento
- [ ] **Retentativas Exponenciais** - Retry automático com backoff
- [ ] **Dead-Letter Queue (DLQ)** - Fila para eventos que falharam
- [ ] **Event Replay** - Reprocessar eventos históricos

### Fase 4: Escalabilidade & Performance

- [ ] **Cache com Redis** - Reduzir carga no BD
- [ ] **Database Connection Pooling** - Otimizar conexões
- [ ] **Compressão de respostas** - GZIP para payloads grandes
- [ ] **Cluster Mode** - Multi-processo com load balancing

### Fase 5: Integração & Extensibilidade

- [ ] **Suporte a múltiplas estratégias de entrega** - Email, SMS, Push, Webhook
- [ ] **Template Engine para notificações** - Mustache/Handlebars
- [ ] **Webhooks Externos** - Disparar webhooks pós-processamento
- [ ] **Plugins/Extensões** - Sistema modular de extensões

### Fase 6: Conformidade & Qualidade

- [ ] **Testes Unitários** - Jest/Vitest
- [ ] **Testes de Integração** - Supertest para endpoints
- [ ] **E2E Testing** - Cucumber/Playwright
- [ ] **GDPR Compliance** - Retenção e exclusão de dados
- [ ] **Health Checks** - Endpoint `/health` detalhado

---

## 👤 Autor

Projeto Serviço de Notificações

## 📄 Licença

ISC — veja o arquivo `LICENSE` para detalhes.

---

---

## 🇺🇸 English Version

# Notifications Service — Node.js API

REST API to receive events via Webhook and trigger notification processing. Designed to be lightweight, straightforward, and ready for integration with external services (queue, retries, dead-letter) in future iterations.

### About the project

This service exposes a Webhook endpoint to receive JSON events and respond with 202 (Accepted), keeping coupling minimal. Developed with modular architecture, separation of concerns, and ready to evolve with asynchronous processing components.

**Key features:**
- Lightweight and scalable API
- Module separation (webhook, processor)
- Consistent responses with basic payload validation
- Ready for integration with message queues (RabbitMQ, SQS, etc.)
- Persistence with Prisma ORM and MySQL

---

## ✅ Prerequisites

Before you start, make sure you have:

- **Node.js** (version 18 or higher) — Download: https://nodejs.org/
- **npm** (included with Node.js)
- **MySQL** (version 5.7 or higher) — Download: https://www.mysql.com/
- **Git** (optional, to clone the repository)

To verify installed versions:

```bash
node --version
npm --version
mysql --version
```

---

## 📦 Technologies used

| Technology | Version | Description |
|---|---|---|
| Node.js | 18+ | JavaScript runtime |
| Express | Latest | Minimalist web framework |
| TypeScript | Latest | Typed JavaScript superset |
| Prisma | Latest | Type-safe ORM for Node.js |
| MySQL | 5.7+ | Relational database |
| CORS | Latest | Cross-origin middleware |
| dotenv | Latest | Environment variable management |
| tsx | Latest | Direct TypeScript executor |

---

## 📁 Project structure

```
servico-notificacoes/
├── LICENSE
├── package.json
├── tsconfig.json
├── prisma.config.ts
├── README.md
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20251227205631_create_event_table/
│           └── migration.sql
└── src/
    ├── server.ts                    # Application entry point
    ├── modules/
    │   ├── events/
    │   │   ├── controllers/
    │   │   │   └── EventController.js
    │   │   ├── services/
    │   │   │   └── EventService.js
    │   │   └── infra/
    │   ├── processor/
    │   │   ├── event.queue.ts      # Processing queue
    │   │   ├── EventProcessorService.ts
    │   │   └── EventWorker.ts
    │   └── webhook/
    │       ├── webhook.controller.ts
    │       └── webhook.routes.ts
    └── shared/
        ├── http/
        │   └── routes/
        │       └── index.ts
        └── infra/
            ├── prisma.ts           # Prisma client
            └── db/
```

**Structure details:**

- **prisma/**: Prisma configs, database schema, and migrations
- **src/server.ts**: Initializes Express, middleware, and routes
- **src/modules/webhook/**: Receives events via HTTP and validates
- **src/modules/processor/**: Processes events in background
- **src/modules/events/**: Business logic for events
- **src/shared/infra/**: Database configuration

---

## 🔌 Main endpoints

### Root - Check service status

**Method:** `GET`  
**Route:** `/`  
**Description:** Checks application status  
**Authentication:** Not required  

**Request example:**
```bash
curl http://localhost:3333/
```

**Expected response (200):**
```json
{
  "message": "Serviço de Notificações Ativo"
}
```

---

### Webhook - Receive events

**Method:** `POST`  
**Route:** `/webhook`  
**Description:** Receives a JSON payload with event data. Returns 400 if empty/invalid, 202 if valid and persists event.  
**Authentication:** Not required (will be added in future versions)  
**Content-Type:** `application/json`

**Body parameters:**
```json
{
  "tipo": "string",              // Event type (e.g., "order_created")
  "dados": "object",             // Additional event data
  "timestamp": "ISO8601 (optional)"
}
```

**Request example:**
```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "order_created",
    "dados": {
      "orderId": 123,
      "clientId": 45,
      "amount": 249.90,
      "items": [
        { "productId": 1, "quantity": 2, "price": 99.90 }
      ]
    }
  }'
```

**Possible responses:**

- **202 Accepted** (Success):
```json
{
  "message": "Evento recebido com sucesso!",
  "recebido": {
    "tipo": "order_created",
    "dados": { "orderId": 123, "amount": 249.90 }
  }
}
```

- **400 Bad Request** (Error):
```json
{
  "error": "Payload vazio ou inválido."
}
```

---

## 💡 Use cases

### Use Case 1: E-commerce Order Notification

An e-commerce system creates an order and needs to notify the customer and logistics team.

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "order_created",
    "dados": {
      "orderId": "ORD-2025-001",
      "clientId": 789,
      "email": "customer@example.com",
      "amount": 1299.99,
      "items": 3
    }
  }'
```

**Expected flow:**
1. Webhook receives and validates payload
2. Event is stored in database with status `PENDING`
3. 202 response is sent immediately to client
4. Processor picks up event from queue
5. Notifications are dispatched (email, SMS, external webhook, etc.)

---

### Use Case 2: Payment Gateway Confirmation

A payment gateway notifies about approved transaction.

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "payment_approved",
    "dados": {
      "transactionId": "TRX-987654",
      "orderId": "ORD-2025-001",
      "amount": 1299.99,
      "method": "credit_card"
    }
  }'
```

---

### Use Case 3: Inventory Alert

Critical stock level for a product.

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "stock_critical",
    "dados": {
      "productId": 456,
      "name": "Product XYZ",
      "stock": 2,
      "minimum": 10
    }
  }'
```

---

## 📊 Complete Usage Flow

```
┌─────────────────────┐
│   External System   │
│  (E-commerce,       │
│   Gateway, etc)     │
└──────────┬──────────┘
           │
           │ 1. POST /webhook
           │ (event as JSON)
           ▼
┌─────────────────────┐
│  Webhook Receiver   │
│ (webhook.routes)    │
└──────────┬──────────┘
           │
           │ 2. Validation
           │    of payload
           ▼
┌─────────────────────┐
│  EventController    │
│ (validates input)   │
└──────────┬──────────┘
           │
           │ 3. Persists
           │    event
           ▼
┌─────────────────────┐
│  Database           │
│  (MySQL + Prisma)   │
│  Status: PENDING    │
└──────────┬──────────┘
           │
           │ 4. Returns 202
           │    (Accepted)
           ▼
┌─────────────────────┐
│  Client / External  │
│  System (Callback)  │
└─────────────────────┘

┌─────────────────────┐
│ EventProcessor      │
│ (Polls from queue)  │
└──────────┬──────────┘
           │
           │ 5. Fetches events
           │    with PENDING status
           ▼
┌─────────────────────┐
│  Database           │
└──────────┬──────────┘
           │
           │ 6. Event found
           │
           ▼
┌─────────────────────┐
│ EventProcessorSvc   │
│ (Processes event)   │
└──────────┬──────────┘
           │
           │ 7. Executes actions
           │    (email, SMS, webhook)
           │
           ├─► Email Sender
           ├─► SMS Sender
           └─► Webhook Call
           │
           ▼
┌─────────────────────┐
│  Database           │
│  Status: PROCESSED  │
│  processed_at: now  │
└─────────────────────┘
```

**Flow summary:**
1. External system sends event via POST to `/webhook`
2. Validation and storage in database (status: PENDING)
3. Immediate 202 response to client
4. Processor fetches pending events
5. Processes and updates status (PROCESSED or ERROR)
6. Records timestamp and error details if any

---

## ⚙️ How to run the project

### Step 1: Clone the repository

```bash
git clone <repository-url>
cd servico-notificacoes
```

### Step 2: Install dependencies

```bash
npm install
```

This will install all dependencies listed in `package.json`:
- express (HTTP server)
- prisma (ORM)
- cors (middleware)
- dotenv (environment variables)
- tsx (TypeScript executor)
- and others...

### Step 3: Configure environment variables

Create a `.env` file in the project root:

```env
# Server port
PORT=3333

# MySQL Database
DATABASE_URL="mysql://user:password@localhost:3306/servico_notificacoes"

# Environment
NODE_ENV=development
```

**Field explanation:**
- `PORT`: Port where the server will run (default: 3333)
- `DATABASE_URL`: MySQL connection string (format: `mysql://user:password@host:port/database`)
- `NODE_ENV`: Execution environment (development/production)

If you don't set variables, defaults are used:
- `PORT=3333`
- `DATABASE_URL=mysql://root:@localhost:3306/servico_notificacoes`

---

### Step 4: Configure the database

**4.1: Create MySQL database**

Access MySQL CLI and create the database:

```bash
mysql -u root -p
```

At MySQL prompt:
```sql
CREATE DATABASE servico_notificacoes;
```

**4.2: Run Prisma migrations**

Migrations will create tables automatically:

```bash
npx prisma migrate dev
```

This will execute all files in `prisma/migrations/` and sync schema with database.

**Alternative (create from scratch):**
```bash
npx prisma generate
```

**Verify database (optional):**
```bash
mysql -u root -p servico_notificacoes
```

```sql
SHOW TABLES;
DESCRIBE events;
```

---

### Step 5: Run the server

**Development mode (with hot reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm run build
npm run start
```

Server will start at:
```
http://localhost:3333
```

You'll see logs in console:
```
🚀 Server running at http://localhost:3333
```

---

## 🧪 Test the application

### Test 1: Health Check

```bash
curl http://localhost:3333/
```

**Expected response:**
```json
{
  "message": "Serviço de Notificações Ativo"
}
```

---

### Test 2: Send valid event

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "order_created",
    "dados": { "orderId": 123, "amount": 99.90 }
  }'
```

**Expected response (202):**
```json
{
  "message": "Evento recebido com sucesso!",
  "recebido": {
    "tipo": "order_created",
    "dados": { "orderId": 123, "amount": 99.90 }
  }
}
```

---

### Test 3: Send empty payload

```bash
curl -X POST http://localhost:3333/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected response (400):**
```json
{
  "error": "Payload vazio ou inválido."
}
```

---

## 🔒 Security

### Implemented

- ✅ CORS enabled
- ✅ Basic payload validation
- ✅ TypeScript types for type-safety

### Production recommendations

- 🔐 Implement JWT authentication
- 🔐 Add HMAC signature for webhooks
- 🔐 IP allowlist/denylist
- 🔐 Rate limiting (throttling)
- 🔐 Structured logging and auditing
- 🔐 Encryption of sensitive data
- 🔐 HTTPS/TLS mandatory

---

## 🤝 How to Contribute

1. **Fork** the repository

2. **Create a branch** for your feature:
```bash
git checkout -b feature/your-feature
git checkout -b fix/your-bug
```

3. **Commit with semantic messages:**
```bash
git commit -m "feat: adds new functionality"
git commit -m "fix: fixes validation bug"
git commit -m "docs: updates README"
```

**Recommended prefixes:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting (no logic change)
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Dependency updates

4. **Push** to the branch:
```bash
git push origin feature/your-feature
```

5. **Open a Pull Request** describing:
   - What was changed
   - Why it was changed
   - How to test it

---

## 🛣️ Roadmap

### Phase 1: Security & Authentication

- [ ] **JWT Authentication** - JWT tokens for protected endpoints
- [ ] **Webhook Validation with HMAC** - Request signing
- [ ] **Rate Limiting** - Abuse protection (IP throttling)
- [ ] **API Key Management** - API key system

### Phase 2: Documentation & Observability

- [ ] **Swagger/OpenAPI Documentation** - Interactive endpoint spec
- [ ] **Structured Logging** - Implement pino/winston with JSON
- [ ] **Prometheus Metrics** - Export metrics for monitoring
- [ ] **Distributed Tracing** - Jaeger/Zipkin for request tracing

### Phase 3: Asynchronous Processing

- [ ] **Message Queue (RabbitMQ/SQS)** - Decouple processing
- [ ] **Exponential Retries** - Automatic retry with backoff
- [ ] **Dead-Letter Queue (DLQ)** - Queue for failed events
- [ ] **Event Replay** - Reprocess historical events

### Phase 4: Scalability & Performance

- [ ] **Redis Caching** - Reduce database load
- [ ] **Database Connection Pooling** - Optimize connections
- [ ] **Response Compression** - GZIP for large payloads
- [ ] **Cluster Mode** - Multi-process load balancing

### Phase 5: Integration & Extensibility

- [ ] **Multiple delivery strategies** - Email, SMS, Push, Webhook
- [ ] **Template Engine for notifications** - Mustache/Handlebars
- [ ] **External Webhooks** - Trigger webhooks post-processing
- [ ] **Plugins/Extensions** - Modular extension system

### Phase 6: Compliance & Quality

- [ ] **Unit Tests** - Jest/Vitest
- [ ] **Integration Tests** - Supertest for endpoints
- [ ] **E2E Testing** - Cucumber/Playwright
- [ ] **GDPR Compliance** - Data retention and deletion
- [ ] **Health Checks** - Detailed `/health` endpoint

---

## 👤 Author

Notifications Service Project

## 📄 License

ISC — see the `LICENSE` file for details.

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
