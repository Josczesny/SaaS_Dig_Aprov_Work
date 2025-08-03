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
    
    console.log('=== DEBUG ROTA LOGS ===');
    console.log('Parâmetros recebidos:', { startDate, endDate, approverID, action });
    console.log('User autenticado:', req.user ? req.user.email : 'NONE');
    
    const logs = await auditService.getAuditLogs({
      startDate,
      endDate,
      approverID,
      action
    });

    console.log('Logs retornados pelo serviço:', logs.length);
    if (logs.length > 0) {
      console.log('Primeiro log:', logs[0].timestamp);
      console.log('Último log:', logs[logs.length - 1].timestamp);
    }

    res.json({ logs });
  } catch (error) {
    console.error('Erro na rota de logs:', error);
    auditLogger.error('Erro ao buscar logs de auditoria', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Middleware para desabilitar cache
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.removeHeader('ETag');
  res.removeHeader('Last-Modified');
  next();
};

// GET /api/audit/export/csv
router.get('/export/csv', noCache, authenticateToken, authorizeAuditor, apiLimiter, securityLogger, async (req, res) => {
  try {
    console.log('=== ROTA EXPORTAÇÃO CSV CHAMADA ===');
    const { startDate, endDate } = req.query;
    
    console.log('Exportação CSV - Parâmetros:', { startDate, endDate });
    console.log('User autenticado:', req.user ? req.user.email : 'NONE');
    
    // Usar a nova lógica de exportação com ajuste de período
    console.log('Chamando auditService.exportAuditLogs...');
    const csvContent = await auditService.exportAuditLogs({
      format: 'csv',
      startDate,
      endDate
    });
    
    // Verificar se o conteúdo foi gerado corretamente
    console.log('CSV gerado - Tamanho:', csvContent.length, 'bytes');
    console.log('Primeiras 200 caracteres:', csvContent.toString('utf-8').substring(0, 200));
    
    // Gerar nome do arquivo baseado no período
    const fileName = `audit-logs-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', csvContent.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(csvContent);

  } catch (error) {
    console.error('Erro detalhado ao exportar CSV:', error);
    auditLogger.error('Erro ao exportar CSV', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/audit/export/pdf
router.get('/export/pdf', noCache, authenticateToken, authorizeAuditor, apiLimiter, securityLogger, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    console.log('Exportação PDF - Parâmetros:', { startDate, endDate });
    
    // Usar a nova lógica de exportação com ajuste de período
    const pdfContent = await auditService.exportAuditLogs({
      format: 'pdf',
      startDate,
      endDate
    });
    
    // Verificar se o conteúdo foi gerado corretamente
    console.log('PDF gerado - Tamanho:', pdfContent.length, 'bytes');
    
    // Gerar nome do arquivo baseado no período
    const fileName = `audit-logs-${startDate || 'all'}-to-${endDate || 'all'}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfContent.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(pdfContent);

  } catch (error) {
    console.error('Erro detalhado ao exportar PDF:', error);
    auditLogger.error('Erro ao exportar PDF', { error: error.message });
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