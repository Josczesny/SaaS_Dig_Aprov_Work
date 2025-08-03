const torDetectionService = require('../services/torDetection');
const { logger } = require('../utils/logger');

// Middleware de bloqueio de Tor
const blockTorAccess = async (req, res, next) => {
  try {
    // Verificar se é ambiente de teste (pular verificação)
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    // Verificar acesso Tor
    const torCheck = await torDetectionService.checkTorAccess(req);
    
    // Log para debugging (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      logger.info('Verificação Tor', {
        ip: torCheck.ip,
        isTor: torCheck.isTor,
        reason: torCheck.reason,
        suspiciousCount: torCheck.suspiciousCount,
        userAgent: req.headers['user-agent'],
        path: req.path
      });
    }
    
    if (torCheck.isTor) {
      // Log detalhado do bloqueio
      logger.warn('Acesso bloqueado - Detecção Tor', {
        ip: torCheck.ip,
        reason: torCheck.reason,
        suspiciousPatterns: torCheck.suspiciousPatterns,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
          'cf-connecting-ip': req.headers['cf-connecting-ip'],
          'accept-language': req.headers['accept-language'],
          'accept-encoding': req.headers['accept-encoding']
        },
        timestamp: new Date().toISOString()
      });

      // Retornar erro 403 com mensagem genérica
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Este serviço não está disponível através de proxies anônimos'
      });
    }

    // Adicionar informações de Tor ao request para logging
    req.torInfo = {
      ip: torCheck.ip,
      isTor: torCheck.isTor,
      reason: torCheck.reason,
      suspiciousPatterns: torCheck.suspiciousPatterns
    };

    next();

  } catch (error) {
    logger.error('Erro na verificação Tor', {
      error: error.message,
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // Em caso de erro, permitir acesso (fail-safe)
    next();
  }
};

// Middleware para rotas específicas (mais restritivo)
const blockTorOnSensitiveRoutes = async (req, res, next) => {
  try {
    // Verificar se é ambiente de teste
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    // Rotas sensíveis que devem bloquear Tor
    const sensitiveRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/change-password',
      '/api/approval/submit',
      '/api/approval/respond',
      '/api/audit/logs',
      '/api/audit/export'
    ];

    const isSensitiveRoute = sensitiveRoutes.some(route => 
      req.path.includes(route)
    );

    if (!isSensitiveRoute) {
      return next();
    }

    // Verificação mais rigorosa para rotas sensíveis
    const torCheck = await torDetectionService.checkTorAccess(req);
    
    if (torCheck.isTor || torCheck.suspiciousPatterns) {
      logger.warn('Acesso bloqueado em rota sensível - Tor detectado', {
        ip: torCheck.ip,
        reason: torCheck.reason,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Operações sensíveis não são permitidas através de proxies anônimos'
      });
    }

    next();

  } catch (error) {
    logger.error('Erro na verificação Tor para rota sensível', {
      error: error.message,
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    // Em caso de erro, permitir acesso (fail-safe)
    next();
  }
};

// Middleware para logging de tentativas de Tor
const logTorAttempts = (req, res, next) => {
  if (req.torInfo && req.torInfo.isTor) {
    logger.info('Tentativa de acesso Tor bloqueada', {
      ip: req.torInfo.ip,
      reason: req.torInfo.reason,
      path: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Middleware para estatísticas de Tor
const torStats = (req, res, next) => {
  // Adicionar estatísticas ao response headers (apenas para admins)
  if (req.user && req.user.role === 'admin') {
    const stats = torDetectionService.getStats();
    res.set('X-Tor-Stats', JSON.stringify(stats));
  }
  
  next();
};

module.exports = {
  blockTorAccess,
  blockTorOnSensitiveRoutes,
  logTorAttempts,
  torStats
}; 