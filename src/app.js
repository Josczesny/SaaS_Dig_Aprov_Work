const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('./utils/logger');
const approvalRoutes = require('./routes/approval');
const auditRoutes = require('./routes/audit');
const authRoutes = require('./routes/auth');
const securityRoutes = require('./routes/security');
const { 
  blockTorAccess, 
  blockTorOnSensitiveRoutes, 
  logTorAttempts, 
  torStats 
} = require('./middleware/torBlock');

// Configuração de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança e parsing
// Configurar CSP para permitir Font Awesome
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../public')));

// Middleware de bloqueio de Tor (global)
app.use(blockTorAccess);

// Middleware de bloqueio de Tor para rotas sensíveis
app.use(blockTorOnSensitiveRoutes);

// Middleware de logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    userID: req.headers['user-id'],
    timestamp: new Date().toISOString()
  });
  next();
});

// Middleware de logging de tentativas Tor
app.use(logTorAttempts);

// Middleware de estatísticas Tor
app.use(torStats);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/security', securityRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rota para o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  logger.error('Erro na aplicação', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Só iniciar o servidor se não estiver em teste
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Servidor iniciado na porta ${PORT}`);
  });
}

module.exports = app; 