const express = require('express');
const { auditLogger } = require('../utils/logger');
const auditService = require('../services/auditService');
const { 
  authenticateToken, 
  authorizeAuditor,
  apiLimiter,
  securityLogger 
} = require('../middleware/auth');

const router = express.Router();

// GET /api/audit/logs
router.get('/logs', authenticateToken, authorizeAuditor, apiLimiter, securityLogger, async (req, res) => {
  try {
    const { startDate, endDate, approverID, action } = req.query;
    
    const logs = await auditService.getAuditLogs({
      startDate,
      endDate,
      approverID,
      action
    });

    res.json({ logs });
  } catch (error) {
    auditLogger.error('Erro ao buscar logs de auditoria', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/audit/export
router.get('/export', authenticateToken, authorizeAuditor, apiLimiter, securityLogger, async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    
    if (!['csv', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Formato inválido' });
    }

    const exportData = await auditService.exportAuditLogs({
      format,
      startDate,
      endDate
    });

    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit-${Date.now()}.${format}`);
    res.send(exportData);

  } catch (error) {
    auditLogger.error('Erro ao exportar logs', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/audit/log
router.post('/log', async (req, res) => {
  try {
    const { approver, action, timestamp, comment } = req.body;
    
    // Validação básica
    if (!approver || !action || !timestamp) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const auditEntry = await auditService.createAuditLog({
      approver,
      action,
      timestamp,
      comment
    });

    auditLogger.info('Log de auditoria criado', auditEntry);

    res.status(201).json({
      message: 'Log de auditoria registrado',
      logID: auditEntry.id
    });

  } catch (error) {
    auditLogger.error('Erro ao criar log de auditoria', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 