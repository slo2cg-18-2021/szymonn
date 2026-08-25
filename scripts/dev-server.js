import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Import API handlers
const apiHandlers = {
  products: null,
  brands: null,
  gammas: null,
  check_session: null,
  login: null,
  logout: null,
  create_admin: null,
  budget: null
};

// Dynamically import handlers
async function loadHandlers() {
  try {
    const productsModule = await import('../api/products.ts');
    apiHandlers.products = productsModule.default;
    
    const brandsModule = await import('../api/brands.ts');
    apiHandlers.brands = brandsModule.default;
    
    const gammasModule = await import('../api/gammas.ts');
    apiHandlers.gammas = gammasModule.default;
    
    const checkSessionModule = await import('../api/check_session.ts');
    apiHandlers.check_session = checkSessionModule.default;
    
    const loginModule = await import('../api/login.ts');
    apiHandlers.login = loginModule.default;
    
    const logoutModule = await import('../api/logout.ts');
    apiHandlers.logout = logoutModule.default;
    
    const budgetModule = await import('../api/budget.ts');
    apiHandlers.budget = budgetModule.default;
    
    console.log('✅ API handlers loaded');
  } catch (error) {
    console.error('❌ Error loading handlers:', error);
  }
}

// API routes
app.all('/api/products', async (req, res) => {
  if (apiHandlers.products) {
    await apiHandlers.products(req, res);
  } else {
    res.status(500).json({ error: 'Handler not loaded' });
  }
});

app.all('/api/brands', async (req, res) => {
  if (apiHandlers.brands) {
    await apiHandlers.brands(req, res);
  } else {
    res.status(500).json({ error: 'Handler not loaded' });
  }
});

app.all('/api/gammas', async (req, res) => {
  if (apiHandlers.gammas) {
    await apiHandlers.gammas(req, res);
  } else {
    res.status(500).json({ error: 'Handler not loaded' });
  }
});

app.all('/api/check_session', async (req, res) => {
  if (apiHandlers.check_session) {
    await apiHandlers.check_session(req, res);
  } else {
    res.status(500).json({ error: 'Handler not loaded' });
  }
});

app.all('/api/login', async (req, res) => {
  if (apiHandlers.login) {
    await apiHandlers.login(req, res);
  } else {
    res.status(500).json({ error: 'Handler not loaded' });
  }
});

app.all('/api/logout', async (req, res) => {
  if (apiHandlers.logout) {
    await apiHandlers.logout(req, res);
  } else {
    res.status(500).json({ error: 'Handler not loaded' });
  }
});

app.all('/api/budget', async (req, res) => {
  if (apiHandlers.budget) {
    await apiHandlers.budget(req, res);
  } else {
    res.status(500).json({ error: 'Handler not loaded' });
  }
});

// Start server
loadHandlers().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`   Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}`);
  });
});
