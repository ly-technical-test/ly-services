# Backend Service (ly-services)

Microserviço principal do ecossistema Lytex, responsável por gerenciar a lógica de negócios, clientes e cobranças. Construído com NestJS e MongoDB.

---

## 1. Arquitetura e Tecnologias

- **Framework**: NestJS (Node.js)
- **Linguagem**: TypeScript
- **Banco de Dados**: MongoDB
- **Segurança**: JWT e Bcrypt (Autenticação e Hash, respectivamente)
- **Testes**: Jest

---

## 2. Requisitos Atendidos

- **Clientes**: Cadastro e listagem.
- **Cobranças**: Emissão, gestão e liquidação de cobranças (Pix, Boleto e Cartão de Crédito).
- **Lytex API**: Integração completa com simulação de liquidação.
- **Testes**: Unitários com Jest.

---

## 3. Documentação das Rotas

A documentação detalhada (OpenAPI/Swagger) contendo todos os endpoints, parâmetros e payloads pode ser consultada nos links abaixo:

- **Swagger UI**: [https://ly-api.gabs.com.br/ly-docs/docs](https://ly-api.gabs.com.br/ly-docs/docs)
- **Especificação Raw (YAML)**: [GitHub Raw](https://raw.githubusercontent.com/ly-technical-test/ly-docs/refs/heads/production/microservices/ly-services.yaml)

---

## 4. Variáveis de Ambiente

As configurações do serviço devem ser salvas no arquivo `.env`. As chaves necessárias para este microserviço são:

- `APP_NAME`: Nome do microserviço (`ly-services`).
- `EXTERNAL_PORT`: Porta exposta para a API.
- `API_PORT`: Porta interna da aplicação NestJS.
- `ENVIRONMENT`: Ambiente de execução (`development` ou `production`).
- `DOCKER_SUFFIX`: Sufixo para identificação dos contêineres Docker (`dev` ou `deploy`).
- `MONGODB_URI`: URL de conexão com o banco de dados MongoDB.
- `MONGODB_DB_NAME`: Nome do banco de dados a ser utilizado.
- `JWT_SECRET`: Chave privada para assinatura dos tokens JWT.
- `LYTEX_BASE_URL`: URL base do ambiente de integração da Lytex.
- `LYTEX_CLIENT_ID`: Identificador da conta na Lytex.
- `LYTEX_CLIENT_SECRET`: Segredo de autenticação na Lytex.
- `CORS_ORIGIN`: Lista de domínios autorizados a realizar requisições.

---

## 5. Execução Local

### Pré-requisitos
- Node.js 20+
- Docker (para subir dependências locais)

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Inicializar o serviço (preferencialmente via Makefile)
make restart

# 3. Rodar suíte de testes unitários
npm test
```
