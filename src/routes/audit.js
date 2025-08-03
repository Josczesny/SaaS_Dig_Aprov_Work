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

// GET /api/audit/export/csv
router.get('/export/csv', authenticateToken, authorizeAuditor, apiLimiter, securityLogger, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('Exportação CSV - Parâmetros:', { startDate, endDate });
    
    const logs = await auditService.getAuditLogs({
      startDate,
      endDate
    });

    console.log('Logs encontrados para CSV:', logs.length);

    // Gerar CSV
    const csvContent = await auditService.generateCSV(logs);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${startDate}-to-${endDate}.csv`);
    res.send(csvContent);

  } catch (error) {
    auditLogger.error('Erro ao exportar CSV', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/audit/export/pdf
router.get('/export/pdf', authenticateToken, authorizeAuditor, apiLimiter, securityLogger, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('Exportação PDF - Parâmetros:', { startDate, endDate });
    
    const logs = await auditService.getAuditLogs({
      startDate,
      endDate
    });

    console.log('Logs encontrados para PDF:', logs.length);

    // Gerar PDF
    const pdfContent = await auditService.generatePDF(logs);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${startDate}-to-${endDate}.pdf`);
    res.send(pdfContent);

  } catch (error) {
    auditLogger.error('Erro ao exportar PDF', { error: error.message });
    console.error('Erro detalhado ao exportar PDF:', error);
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