const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');
const User = require('../models/User');

// Configuração JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Rate limiting desabilitado para desenvolvimento
const loginLimiter = (req, res, next) => next();
const apiLimiter = (req, res, next) => next();

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Tentativa de acesso sem token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.warn('Token inválido', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        error: err.message,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }

    // Buscar usuário no banco
    const user = User.findById(decoded.userId);
    if (!user) {
      logger.warn('Usuário não encontrado para token', {
        userId: decoded.userId,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }

    if (!user.isActive) {
      logger.warn('Tentativa de acesso com usuário inativo', {
        userId: user.id,
        email: user.email,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ error: 'Usuário inativo' });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  });
};

// Middleware de autorização por role
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticação necessária' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!req.user.hasAnyRole(userRoles)) {
      logger.warn('Acesso negado por role insuficiente', {
        userId: req.user.id,
        email: req.user.email,
        userRole: req.user.role,
        requiredRoles: userRoles,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      return res.status(403).json({ 
        error: 'Acesso negado. Permissões insuficientes.' 
      });
    }

    next();
  };
};

// Middleware específico para aprovadores
const authorizeApprover = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  if (!req.user.canApprove()) {
    logger.warn('Tentativa de aprovação sem permissão', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    return res.status(403).json({ 
      error: 'Apenas aprovadores podem realizar esta ação' 
    });
  }

  next();
};

// Middleware para administradores
const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  if (!req.user.canManageUsers()) {
    logger.warn('Tentativa de acesso administrativo sem permissão', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    return res.status(403).json({ 
      error: 'Acesso restrito a administradores' 
    });
  }

  next();
};

// Middleware para auditores
const authorizeAuditor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária' });
  }

  if (!req.user.canViewAudit()) {
    logger.warn('Tentativa de acesso a auditoria sem permissão', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    return res.status(403).json({ 
      error: 'Acesso restrito a auditores e administradores' 
    });
  }

  next();
};

// Função para gerar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Middleware de logging de segurança
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log de segurança para ações sensíveis
    if (req.path.includes('/login') || req.path.includes('/auth') || 
        req.path.includes('/admin') || req.path.includes('/audit')) {
      logger.info('Ação de segurança', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        userId: req.user?.id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  next();
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizeApprover,
  authorizeAdmin,
  authorizeAuditor,
  generateToken,
  loginLimiter,
  apiLimiter,
  securityLogger,
  JWT_SECRET,
  JWT_EXPIRES_IN
}; 