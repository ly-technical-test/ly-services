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

## 4. Execução Local

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
