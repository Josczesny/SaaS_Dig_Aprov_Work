const express = require('express');
const { logger } = require('../utils/logger');
const torDetectionService = require('../services/torDetection');
const { 
  authenticateToken, 
  authorizeAdmin,
  securityLogger 
} = require('../middleware/auth');

const router = express.Router();

// GET /api/security/tor-stats
router.get('/tor-stats', authenticateToken, authorizeAdmin, securityLogger, (req, res) => {
  try {
    const stats = torDetectionService.getStats();
    
    logger.info('Estatísticas Tor consultadas', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Estatísticas de detecção Tor',
      stats: {
        torExitNodesCount: stats.torExitNodesCount,
        verifiedCacheSize: stats.verifiedCacheSize,
        lastUpdate: stats.lastUpdate,
        cacheHitRate: stats.verifiedCacheSize / (stats.torExitNodesCount || 1) * 100
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas Tor', {
      error: error.message,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/security/tor-cache/clear
router.post('/tor-cache/clear', authenticateToken, authorizeAdmin, securityLogger, (req, res) => {
  try {
    torDetectionService.clearCache();
    
    logger.info('Cache Tor limpo', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Cache de detecção Tor limpo com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao limpar cache Tor', {
      error: error.message,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/security/tor-cache/update
router.post('/tor-cache/update', authenticateToken, authorizeAdmin, securityLogger, async (req, res) => {
  try {
    await torDetectionService.updateTorExitNodes();
    
    logger.info('Lista Tor atualizada manualmente', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      timestamp: new Date().toISOString()
    });

    const stats = torDetectionService.getStats();

    res.json({
      message: 'Lista de nós Tor atualizada com sucesso',
      stats: {
        torExitNodesCount: stats.torExitNodesCount,
        lastUpdate: stats.lastUpdate
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao atualizar lista Tor', {
      error: error.message,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/security/blocked-ips
router.get('/blocked-ips', authenticateToken, authorizeAdmin, securityLogger, (req, res) => {
  try {
    // Em um sistema real, você teria uma tabela de IPs bloqueados
    // Por enquanto, retornamos informações básicas
    const stats = torDetectionService.getStats();
    
    logger.info('IPs bloqueados consultados', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Informações de IPs bloqueados',
      data: {
        torExitNodesCount: stats.torExitNodesCount,
        verifiedCacheSize: stats.verifiedCacheSize,
        lastUpdate: stats.lastUpdate,
        note: 'IPs bloqueados são gerenciados automaticamente pelo sistema'
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar IPs bloqueados', {
      error: error.message,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 