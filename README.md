# VERYFIN API

API REST para controle financeiro pessoal desenvolvida com Express.js, TypeScript e SQLite.

## 🚀 Funcionalidades

- **Autenticação Segura**: Sistema completo de login/registro com email/senha
- **Gestão de Despesas**: CRUD completo para controle de gastos
- **Metas Financeiras**: Gerenciamento de objetivos de poupança
- **Relatórios**: Análises e estatísticas financeiras
- **API Externa**: Integração com cotação de moedas
- **Documentação Swagger**: API documentada e testável

## 🛠️ Tecnologias Utilizadas

- **Express.js** com TypeScript
- **SQLite** com Drizzle ORM
- **Bcrypt** para criptografia de senhas
- **Express Session** para gerenciamento de sessões
- **Swagger** para documentação da API
- **CORS** para requisições cross-origin
- **Helmet** para segurança
- **Morgan** para logging

## 📚 Documentação da API

A API está documentada com Swagger e pode ser acessada em:

```
http://localhost:3001/api-docs
```

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/logout` - Fazer logout
- `GET /api/auth/me` - Obter dados do usuário logado

#### Despesas
- `GET /api/expenses` - Listar despesas do usuário
- `POST /api/expenses` - Criar nova despesa
- `PUT /api/expenses/:id` - Atualizar despesa
- `DELETE /api/expenses/:id` - Excluir despesa

#### Metas Financeiras
- `GET /api/goals` - Listar metas do usuário
- `POST /api/goals` - Criar nova meta
- `PUT /api/goals/:id` - Atualizar meta
- `DELETE /api/goals/:id` - Excluir meta

#### API Externa
- `GET /api/external/currency` - Obter cotação de moedas

## 🗄️ Banco de Dados

### SQLite
- **Arquivo**: `database.sqlite`
- **ORM**: Drizzle ORM
- **Sessões**: `sessions.db`

### Tabelas Principais

```sql
-- Usuários
users (id, email, password, firstName, lastName, createdAt, updatedAt)

-- Despesas
expenses (id, userId, description, amount, category, date, isRecurring, createdAt)

-- Metas
goals (id, userId, title, description, targetAmount, currentAmount, category, targetDate, status, createdAt, updatedAt)

-- Sessões
sessions (sid, sess, expire)
```

## 🚦 Como Executar

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/barnaud18/VERYFIN-API.git
   cd VERYFIN-API
   ```

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e configure:
   ```env
   PORT=3001
   SESSION_SECRET=sua-chave-secreta-aqui
   NODE_ENV=development
   ```

4. **Configurar banco de dados**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Iniciar servidor**:
   ```bash
   npm run dev
   ```

6. **Acessar**:
   - API: http://localhost:3001
   - Documentação Swagger: http://localhost:3001/api-docs
   - Health check: http://localhost:3001/health

### Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run check` - Verifica tipos TypeScript
- `npm run db:generate` - Gera migrações do banco
- `npm run db:push` - Aplica migrações ao banco
- `npm run db:migrate` - Executa migrações

## 🔐 Segurança

- **Autenticação**: Sistema de login/registro com bcrypt
- **Sessões**: Gerenciamento seguro de sessões com SQLite
- **CORS**: Configuração para requisições cross-origin
- **Helmet**: Headers de segurança
- **Validação**: Validação robusta de dados de entrada
- **Sanitização**: Proteção contra injeção de dados

## 📊 API Externa

### Cotação de Moedas
A API integra com a [Exchange Rate API](https://exchangerate-api.com/) para obter cotações de moedas:

- **Endpoint**: `GET /api/external/currency`
- **Base**: BRL (Real Brasileiro)
- **Licença**: Gratuita para uso pessoal
- **Limite**: 1000 requisições por mês
- **Documentação**: https://exchangerate-api.com/docs

### Exemplo de Resposta
```json
{
  "base": "BRL",
  "rates": {
    "USD": 0.21,
    "EUR": 0.19,
    "GBP": 0.16
  },
  "lastUpdated": "2024-01-15"
}
```

## 📁 Estrutura do Projeto

```
├── index.ts              # Arquivo principal da aplicação
├── db.ts                 # Configuração do banco de dados
├── shared/
│   └── schema.ts         # Schema do banco de dados
├── migrations/           # Migrações do banco
├── package.json          # Dependências e scripts
├── drizzle.config.ts     # Configuração do Drizzle
└── README.md            # Esta documentação
```

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente

```env
# Servidor
PORT=3001
NODE_ENV=development

# Sessão
SESSION_SECRET=sua-chave-secreta-aqui

# CORS (opcional)
CORS_ORIGIN=http://localhost:3000
```

### Banco de Dados

O SQLite é configurado automaticamente. Os arquivos são criados na primeira execução:

- `database.sqlite` - Banco principal
- `sessions.db` - Banco de sessões

## 🚀 Deploy

### Render (Recomendado)
1. Conecte seu repositório ao Render
2. Configure as variáveis de ambiente
3. Build command: `npm run build`
4. Start command: `npm start`

### Railway
1. Conecte seu repositório ao Railway
2. Configure as variáveis de ambiente
3. Deploy automático

### Heroku
1. Conecte seu repositório ao Heroku
2. Configure as variáveis de ambiente
3. Build command: `npm run build`
4. Start command: `npm start`

## 🧪 Testes

### Testando com Swagger
1. Acesse http://localhost:3001/api-docs
2. Teste os endpoints diretamente na interface
3. Visualize os schemas e respostas

### Testando com curl
```bash
# Health check
curl http://localhost:3001/health

# Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"123456","firstName":"João","lastName":"Silva"}'

# Fazer login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","password":"123456"}' \
  -c cookies.txt

# Listar despesas (com cookie de sessão)
curl http://localhost:3001/api/expenses -b cookies.txt
```

## 📈 Monitoramento

### Logs
- **Morgan**: Logs de requisições HTTP
- **Console**: Logs de erro e debug
- **Sessões**: Monitoramento de sessões ativas

### Métricas
- **Health Check**: `/health`
- **Status da API**: `/api-docs`
- **Banco de dados**: Verificação automática de conexão

---

**Desenvolvido como MVP para demonstração de conceitos avançados de desenvolvimento backend com documentação Swagger e integração de APIs externas.** 