const express = require('express');
const Joi = require('joi');
const { logger } = require('../utils/logger');
const approvalService = require('../services/approvalService');
const notificationService = require('../services/notificationService');
const { 
  authenticateToken, 
  authorizeApprover, 
  authorizeRole,
  apiLimiter,
  securityLogger 
} = require('../middleware/auth');

const router = express.Router();

// Schema de validação conforme regras
const approvalSchema = Joi.object({
  type: Joi.string().valid('purchase', 'reimbursement', 'vacation').required(),
  amount: Joi.number().positive().when('type', {
    is: 'vacation',
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  requester: Joi.string().email().required()
    .pattern(/^[^';]*$/).message('Email não pode conter caracteres especiais'),
  description: Joi.string().max(500)
    .pattern(/^[^<>]*$/).message('Descrição não pode conter tags HTML')
    .pattern(/^[^';]*$/).message('Descrição não pode conter caracteres especiais')
    .pattern(/^[^()]*$/).message('Descrição não pode conter caracteres especiais')
    .pattern(/^[^"]*$/).message('Descrição não pode conter aspas duplas'),
  approver: Joi.string().email().required()
    .pattern(/^[^';]*$/).message('Email não pode conter caracteres especiais')
});

// POST /api/approval/submit
router.post('/submit', authenticateToken, apiLimiter, securityLogger, async (req, res) => {
  try {
    // Validação do payload
    const { error, value } = approvalSchema.validate(req.body);
    if (error) {
      logger.warn('Validação falhou', { 
        error: error.details[0].message,
        payload: req.body 
      });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    // Criar aprovação
    const approval = await approvalService.createApproval(value);
    
    // Enviar notificação
    await notificationService.sendApprovalNotification(approval);
    
    logger.info('Aprovação criada', {
      approvalID: approval.id,
      type: approval.type,
      requester: approval.requester,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Aprovação criada com sucesso',
      approvalID: approval.id,
      status: 'pending'
    });

  } catch (error) {
    logger.error('Erro ao criar aprovação', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Schema de validação para resposta
const responseSchema = Joi.object({
  action: Joi.string().valid('approved', 'rejected').required(),
  approverID: Joi.string().email().required()
    .pattern(/^[^';]*$/).message('Email não pode conter caracteres especiais'),
  justification: Joi.string().required()
    .pattern(/^[^<>]*$/).message('Justificativa não pode conter tags HTML')
    .pattern(/^[^';]*$/).message('Justificativa não pode conter caracteres especiais')
    .pattern(/^[^()]*$/).message('Justificativa não pode conter caracteres especiais')
    .pattern(/^[^"]*$/).message('Justificativa não pode conter aspas duplas'),
  isAlteration: Joi.boolean().optional(),
  previousStatus: Joi.string().valid('approved', 'rejected', 'pending').optional()
});

// POST /api/approval/:id/respond
router.post('/:id/respond', authenticateToken, authorizeApprover, apiLimiter, securityLogger, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validação do payload
    const { error, value } = responseSchema.validate(req.body);
    if (error) {
      logger.warn('Validação de resposta falhou', { 
        error: error.details[0].message,
        payload: req.body 
      });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    const { action, approverID, justification, isAlteration, previousStatus } = value;

    const result = await approvalService.respondToApproval(id, {
      action,
      approverID,
      justification,
      isAlteration,
      previousStatus
    });

    logger.info('Resposta à aprovação', {
      approvalID: id,
      action,
      approverID,
      status: action
    });

    res.json({
      message: `Aprovação ${action}`,
      approvalID: id,
      status: action
    });

  } catch (error) {
    logger.error('Erro ao responder aprovação', { error: error.message });
    
    // Tratamento específico de erros
    if (error.code === 'APPROVAL_NOT_FOUND') {
      return res.status(404).json({ error: 'Aprovação não encontrada' });
    }
    
    if (error.code === 'INSUFFICIENT_PERMISSIONS') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar decisões' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/approval/pending
router.get('/pending', authenticateToken, apiLimiter, securityLogger, async (req, res) => {
  try {
    const { approverID } = req.query;
    const pendingApprovals = await approvalService.getPendingApprovals(approverID);
    
    res.json({ approvals: pendingApprovals });
  } catch (error) {
    logger.error('Erro ao buscar aprovações pendentes', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/approval/all
router.get('/all', authenticateToken, apiLimiter, securityLogger, async (req, res) => {
  try {
    const allApprovals = await approvalService.getAllApprovals();
    
    res.json({ approvals: allApprovals });
  } catch (error) {
    logger.error('Erro ao buscar todas as aprovações', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/approval/:id
router.get('/:id', authenticateToken, apiLimiter, securityLogger, async (req, res) => {
  try {
    const { id } = req.params;
    const approval = await approvalService.getApprovalById(id);
    
    if (!approval) {
      return res.status(404).json({ error: 'Aprovação não encontrada' });
    }
    
    res.json(approval);
  } catch (error) {
    logger.error('Erro ao buscar aprovação', { error: error.message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/approval/:id
router.delete('/:id', authenticateToken, authorizeRole(['admin']), apiLimiter, securityLogger, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await approvalService.deleteApproval(id, req.user.email);
    
    logger.info('Aprovação deletada', {
      approvalID: id,
      deletedBy: req.user.email
    });
    
    res.json({ message: 'Aprovação deletada com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar aprovação', { error: error.message });
    
    if (error.code === 'APPROVAL_NOT_FOUND') {
      return res.status(404).json({ error: 'Aprovação não encontrada' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Schema de validação para restauração
const restoreSchema = Joi.object({
  deletedApproval: Joi.object({
    id: Joi.string().required(),
    type: Joi.string().valid('purchase', 'reimbursement', 'vacation').required(),
    amount: Joi.number().positive().allow(null).when('type', {
      is: 'vacation',
      then: Joi.optional().allow(null),
      otherwise: Joi.required()
    }),
    requester: Joi.string().email().required(),
    approver: Joi.string().email().required(),
    description: Joi.string().required(),
    status: Joi.string().valid('pending', 'approved', 'rejected').required(),
    createdAt: Joi.string().required()
  }).required(),
  restoredBy: Joi.string().email().required()
    .pattern(/^[^';]*$/).message('Email não pode conter caracteres especiais')
});

// POST /api/approval/:id/restore
router.post('/:id/restore', authenticateToken, authorizeRole(['admin']), apiLimiter, securityLogger, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validação do payload
    const { error, value } = restoreSchema.validate(req.body);
    if (error) {
      logger.warn('Validação de restauração falhou', { 
        error: error.details[0].message,
        payload: req.body 
      });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    const { deletedApproval, restoredBy } = value;

    const result = await approvalService.restoreApproval(id, {
      deletedApproval,
      restoredBy
    });

    logger.info('Aprovação restaurada', {
      approvalID: id,
      restoredBy,
      originalStatus: deletedApproval.status
    });

    res.json({
      message: 'Aprovação restaurada com sucesso',
      approvalID: id,
      status: 'pending'
    });

  } catch (error) {
    logger.error('Erro ao restaurar aprovação', { error: error.message });
    
    // Tratamento específico de erros
    if (error.code === 'APPROVAL_ALREADY_EXISTS') {
      return res.status(409).json({ error: 'Aprovação já existe' });
    }
    
    if (error.code === 'INSUFFICIENT_PERMISSIONS') {
      return res.status(403).json({ error: 'Apenas administradores podem restaurar aprovações' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 