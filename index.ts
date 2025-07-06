import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
import passport from "passport";
import bcrypt from "bcrypt";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { db } from "./db";
import { users, sessions as sessionsTable, expenses, budgets, goals, savingsStreaks, streakEntries } from "./shared/schema";
import { eq, sql } from "drizzle-orm";

const app = express();
const port = process.env.PORT || 3001;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VERYFIN API",
      version: "1.0.0",
      description: "API para controle financeiro pessoal",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Servidor de desenvolvimento",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              example: "123e4567-e89b-12d3-a456-426614174000"
            },
            email: {
              type: "string",
              example: "usuario@email.com"
            },
            firstName: {
              type: "string",
              example: "João"
            },
            lastName: {
              type: "string",
              example: "Silva"
            }
          }
        },
        Expense: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1
            },
            userId: {
              type: "string"
            },
            description: {
              type: "string",
              example: "Supermercado"
            },
            amount: {
              type: "number",
              example: 150.75
            },
            category: {
              type: "string",
              example: "food"
            },
            date: {
              type: "string",
              format: "date",
              example: "2024-07-06"
            }
          }
        },
        ExpenseInput: {
          type: "object",
          required: ["description", "amount", "category", "date"],
          properties: {
            description: {
              type: "string",
              example: "Supermercado"
            },
            amount: {
              type: "number",
              example: 150.75
            },
            category: {
              type: "string",
              example: "food"
            },
            date: {
              type: "string",
              format: "date",
              example: "2024-07-06"
            }
          }
        },
        Goal: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1
            },
            userId: {
              type: "string"
            },
            title: {
              type: "string",
              example: "Viagem"
            },
            description: {
              type: "string",
              example: "Viagem para praia"
            },
            targetAmount: {
              type: "number",
              example: 2000
            },
            currentAmount: {
              type: "number",
              example: 500
            },
            category: {
              type: "string",
              example: "travel"
            },
            targetDate: {
              type: "string",
              format: "date",
              example: "2024-12-31"
            },
            status: {
              type: "string",
              example: "active"
            }
          }
        },
        GoalInput: {
          type: "object",
          required: ["title", "targetAmount", "category", "targetDate"],
          properties: {
            title: {
              type: "string",
              example: "Viagem"
            },
            description: {
              type: "string",
              example: "Viagem para praia"
            },
            targetAmount: {
              type: "number",
              example: 2000
            },
            currentAmount: {
              type: "number",
              example: 500
            },
            category: {
              type: "string",
              example: "travel"
            },
            targetDate: {
              type: "string",
              format: "date",
              example: "2024-12-31"
            }
          }
        },
        Budget: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1
            },
            userId: {
              type: "string"
            },
            category: {
              type: "string",
              example: "food"
            },
            amount: {
              type: "number",
              example: 500
            },
            period: {
              type: "string",
              example: "monthly"
            }
          }
        },
        BudgetInput: {
          type: "object",
          required: ["category", "amount", "period"],
          properties: {
            category: {
              type: "string",
              example: "food"
            },
            amount: {
              type: "number",
              example: 500
            },
            period: {
              type: "string",
              example: "monthly"
            }
          }
        },
        Streak: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1
            },
            userId: {
              type: "string"
            },
            challengeName: {
              type: "string",
              example: "30 dias sem gastar"
            },
            targetAmount: {
              type: "number",
              example: 1000
            },
            frequency: {
              type: "string",
              example: "daily"
            },
            startDate: {
              type: "string",
              format: "date",
              example: "2024-07-01"
            },
            endDate: {
              type: "string",
              format: "date",
              example: "2024-07-30"
            }
          }
        },
        StreakInput: {
          type: "object",
          required: ["challengeName", "targetAmount", "frequency"],
          properties: {
            challengeName: {
              type: "string",
              example: "30 dias sem gastar"
            },
            targetAmount: {
              type: "number",
              example: 1000
            },
            frequency: {
              type: "string",
              example: "daily"
            },
            endDate: {
              type: "string",
              format: "date",
              example: "2024-07-30"
            }
          }
        },
        CurrencyResponse: {
          type: "object",
          properties: {
            base: {
              type: "string",
              example: "BRL"
            },
            rates: {
              type: "object",
              additionalProperties: {
                type: "number"
              },
              example: { USD: 0.21, EUR: 0.19 }
            },
            lastUpdated: {
              type: "string",
              format: "date",
              example: "2024-07-06"
            }
          }
        }
      }
    },
  },
  apis: ["./index.ts"], // Arquivo principal da API
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const SQLiteSession = SQLiteStore(session);
app.use(session({
  store: new SQLiteSession({
    db: 'sessions.db',
    dir: './'
  }),
  secret: process.env.SESSION_SECRET || 'veryfin-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Redirecionar a URL base para a documentação Swagger
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Authentication routes
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Email já existe
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return res.status(409).json({ message: 'Email já está em uso' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.insert(users).values({
      email,
      password: hashedPassword,
      firstName,
      lastName
    }).returning().get();

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao criar sessão' });
      }
      res.json({
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao fazer logout' });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter dados do usuário logado
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       401:
 *         description: Não autenticado
 */
app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  try {
    const user = await db.select().from(users).where(eq(users.id, req.session.userId)).get();
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Middleware de autenticação
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Não autenticado' });
  }
  next();
};

// Expense routes
/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Listar despesas do usuário
 *     tags: [Expenses]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoria
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data inicial
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data final
 *     responses:
 *       200:
 *         description: Lista de despesas
 *       401:
 *         description: Não autenticado
 */
app.get('/api/expenses', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, startDate, endDate } = req.query;

    let query = db.select().from(expenses).where(eq(expenses.userId, userId));

    if (category) {
      query = query.where(eq(expenses.category, category as string));
    }

    if (startDate && endDate) {
      query = query.where(
        sql`${expenses.date} BETWEEN ${startDate} AND ${endDate}`
      );
    }

    const expensesList = await query.all();
    res.json(expensesList);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Erro ao buscar despesas' });
  }
});

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Criar nova despesa
 *     tags: [Expenses]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - amount
 *               - category
 *               - date
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Despesa criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
app.post('/api/expenses', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { description, amount, category, date } = req.body;

    const newExpense = await db.insert(expenses).values({
      userId,
      description,
      amount: parseFloat(amount),
      category,
      date
    }).returning().get();

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Erro ao criar despesa' });
  }
});

// Goals routes
/**
 * @swagger
 * /api/goals:
 *   get:
 *     summary: Listar metas do usuário
 *     tags: [Goals]
 *     responses:
 *       200:
 *         description: Lista de metas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Goal'
 *       401:
 *         description: Não autenticado
 */
app.get('/api/goals', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const goalsList = await db.select().from(goals).where(eq(goals.userId, userId)).all();
    res.json(goalsList);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ message: 'Erro ao buscar metas' });
  }
});

/**
 * @swagger
 * /api/goals:
 *   post:
 *     summary: Criar nova meta
 *     tags: [Goals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoalInput'
 *     responses:
 *       201:
 *         description: Meta criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
app.post('/api/goals', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { title, description, targetAmount, currentAmount, category, targetDate } = req.body;

    const newGoal = await db.insert(goals).values({
      userId,
      title,
      description,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount || 0),
      category,
      targetDate
    }).returning().get();

    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ message: 'Erro ao criar meta' });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   put:
 *     summary: Atualizar meta
 *     tags: [Goals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoalInput'
 *     responses:
 *       200:
 *         description: Meta atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Goal'
 *       404:
 *         description: Meta não encontrada
 *       401:
 *         description: Não autenticado
 */
app.put('/api/goals/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const id = parseInt(req.params.id);
    const { title, description, targetAmount, currentAmount, category, targetDate, status } = req.body;

    const updatedGoal = await db.update(goals)
      .set({
        title,
        description,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || 0),
        category,
        targetDate,
        status,
        updatedAt: new Date()
      })
      .where(eq(goals.id, id))
      .where(eq(goals.userId, userId))
      .returning()
      .get();

    if (!updatedGoal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }

    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ message: 'Erro ao atualizar meta' });
  }
});

/**
 * @swagger
 * /api/goals/{id}:
 *   delete:
 *     summary: Excluir meta
 *     tags: [Goals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Meta excluída
 *       404:
 *         description: Meta não encontrada
 *       401:
 *         description: Não autenticado
 */
app.delete('/api/goals/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const id = parseInt(req.params.id);

    const deletedGoal = await db.delete(goals)
      .where(eq(goals.id, id))
      .where(eq(goals.userId, userId))
      .returning()
      .get();

    if (!deletedGoal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ message: 'Erro ao excluir meta' });
  }
});

// Budgets routes
/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Listar orçamentos do usuário
 *     tags: [Budgets]
 *     responses:
 *       200:
 *         description: Lista de orçamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Budget'
 *       401:
 *         description: Não autenticado
 */
app.get('/api/budgets', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const budgetsList = await db.select().from(budgets).where(eq(budgets.userId, userId)).all();
    res.json(budgetsList);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Erro ao buscar orçamentos' });
  }
});

/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Criar novo orçamento
 *     tags: [Budgets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BudgetInput'
 *     responses:
 *       201:
 *         description: Orçamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
app.post('/api/budgets', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { category, amount, period } = req.body;

    const newBudget = await db.insert(budgets).values({
      userId,
      category,
      amount: parseFloat(amount),
      period
    }).returning().get();

    res.status(201).json(newBudget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Erro ao criar orçamento' });
  }
});

// Streaks routes
/**
 * @swagger
 * /api/streaks:
 *   get:
 *     summary: Listar streaks do usuário
 *     tags: [Streaks]
 *     responses:
 *       200:
 *         description: Lista de streaks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Streak'
 *       401:
 *         description: Não autenticado
 */
app.get('/api/streaks', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const streaksList = await db.select().from(savingsStreaks).where(eq(savingsStreaks.userId, userId)).all();
    res.json(streaksList);
  } catch (error) {
    console.error('Get streaks error:', error);
    res.status(500).json({ message: 'Erro ao buscar streaks' });
  }
});

/**
 * @swagger
 * /api/streaks:
 *   post:
 *     summary: Criar novo streak
 *     tags: [Streaks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StreakInput'
 *     responses:
 *       201:
 *         description: Streak criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Streak'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autenticado
 */
app.post('/api/streaks', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { challengeName, targetAmount, frequency, endDate } = req.body;

    const newStreak = await db.insert(savingsStreaks).values({
      userId,
      challengeName,
      targetAmount: parseFloat(targetAmount),
      frequency,
      endDate,
      startDate: new Date().toISOString().split('T')[0]
    }).returning().get();

    res.status(201).json(newStreak);
  } catch (error) {
    console.error('Create streak error:', error);
    res.status(500).json({ message: 'Erro ao criar streak' });
  }
});

// API externa para cotação de moedas (requisito do MVP)
/**
 * @swagger
 * /api/external/currency:
 *   get:
 *     summary: Obter cotação de moedas
 *     tags: [External API]
 *     responses:
 *       200:
 *         description: Cotação obtida com sucesso
 *       500:
 *         description: Erro ao obter cotação
 */
app.get('/api/external/currency', async (req, res) => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/BRL');
    const data = await response.json();

    res.json({
      base: data.base,
      rates: data.rates,
      lastUpdated: data.date
    });
  } catch (error) {
    console.error('Currency API error:', error);
    res.status(500).json({
      message: 'Erro ao obter cotação de moedas',
      error: 'Serviço temporariamente indisponível'
    });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 VERYFIN API rodando na porta ${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api-docs`);
  console.log(`🏥 Health check: http://localhost:${port}/health`);
});
