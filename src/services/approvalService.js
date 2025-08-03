const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const auditService = require('./auditService');
const databaseService = require('./database');
const User = require('../models/User');

class ApprovalService {
  async createApproval(data) {
    const approval = {
      id: uuidv4(),
      type: data.type,
      amount: data.amount,
      requester: data.requester,
      description: data.description,
      approver: data.approver,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      databaseService.createApproval(approval);
      
      logger.info('Aprovação criada', {
        approvalID: approval.id,
        type: approval.type,
        requester: approval.requester,
        status: approval.status
      });

      return approval;
    } catch (error) {
      logger.error('Erro ao criar aprovação', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  async respondToApproval(approvalId, responseData) {
    // Buscar aprovação no banco
    const approval = databaseService.findApprovalById(approvalId);
    
    if (!approval) {
      const error = new Error('Aprovação não encontrada');
      error.code = 'APPROVAL_NOT_FOUND';
      throw error;
    }

    // Verificar se é uma alteração de decisão existente
    const isUpdate = approval.status !== 'pending';
    
    // Se for uma alteração, verificar se o usuário tem permissão
    if (isUpdate) {
      // Apenas administradores podem alterar decisões
      const user = User.findByEmail(responseData.approverID);
      if (!user || user.role !== 'admin') {
        const error = new Error('Apenas administradores podem alterar decisões');
        error.code = 'INSUFFICIENT_PERMISSIONS';
        throw error;
      }
    }

    // Atualizar aprovação no banco
    const updates = {
      status: responseData.action,
      updatedAt: new Date().toISOString(),
      responseAt: new Date().toISOString(),
      responseBy: responseData.approverID,
      action: responseData.action,
      justification: responseData.justification
    };

    try {
      databaseService.updateApproval(approvalId, updates);
    } catch (error) {
      logger.error('Erro ao atualizar aprovação', {
        error: error.message,
        approvalId,
        responseData
      });
      throw error;
    }

    // Registrar log de auditoria com informações de alteração
    const auditData = {
      approver: responseData.approverID,
      action: responseData.action,
      timestamp: new Date().toISOString(),
      comment: responseData.justification,
      approvalID: approvalId,
      isUpdate: isUpdate
    };

    // Adicionar informações específicas de alteração se for uma alteração
    if (responseData.isAlteration && responseData.previousStatus) {
      auditData.metadata = {
        isUpdate: true,
        previousStatus: responseData.previousStatus,
        newStatus: responseData.action
      };
    }

    await auditService.createAuditLog(auditData);

    logger.info(isUpdate ? 'Decisão alterada' : 'Aprovação respondida', {
      approvalID: approvalId,
      action: responseData.action,
      approverID: responseData.approverID,
      status: approval.status,
      isUpdate: isUpdate
    });

    return approval;
  }

  async getPendingApprovals(approverID) {
    try {
      return databaseService.findPendingApprovals(approverID);
    } catch (error) {
      logger.error('Erro ao buscar aprovações pendentes', {
        error: error.message,
        approverID
      });
      throw error;
    }
  }

  async getApprovalById(id) {
    try {
      return databaseService.findApprovalById(id);
    } catch (error) {
      logger.error('Erro ao buscar aprovação', {
        error: error.message,
        id
      });
      throw error;
    }
  }

  async getAllApprovals() {
    try {
      const stmt = databaseService.db.prepare('SELECT * FROM approvals ORDER BY createdAt DESC');
      return stmt.all();
    } catch (error) {
      logger.error('Erro ao buscar todas as aprovações', {
        error: error.message
      });
      throw error;
    }
  }

  async deleteApproval(approvalId, deletedBy) {
    // Buscar aprovação no banco
    const approval = databaseService.findApprovalById(approvalId);
    
    if (!approval) {
      const error = new Error('Aprovação não encontrada');
      error.code = 'APPROVAL_NOT_FOUND';
      throw error;
    }

    try {
      databaseService.deleteApproval(approvalId);
      
      // Registrar log de auditoria para exclusão
      await auditService.createAuditLog({
        approver: deletedBy,
        action: 'deleted',
        timestamp: new Date().toISOString(),
        comment: `Aprovação deletada por ${deletedBy}`,
        approvalID: approvalId,
        isUpdate: false,
        deletedApproval: { // Dados completos da aprovação deletada
          id: approval.id,
          type: approval.type,
          amount: approval.amount,
          requester: approval.requester,
          description: approval.description,
          approver: approval.approver,
          status: approval.status,
          createdAt: approval.createdAt
        }
      });
      
      logger.info('Aprovação deletada', {
        approvalID: approvalId,
        type: approval.type,
        requester: approval.requester,
        deletedBy: deletedBy
      });

      return approval;
    } catch (error) {
      logger.error('Erro ao deletar aprovação', {
        error: error.message,
        approvalId,
        deletedBy: deletedBy
      });
      throw error;
    }
  }

  async restoreApproval(approvalId, restoreData) {
    const { deletedApproval, restoredBy } = restoreData;
    
    // Verificar se a aprovação já existe
    const existingApproval = databaseService.findApprovalById(approvalId);
    if (existingApproval) {
      const error = new Error('Aprovação já existe');
      error.code = 'APPROVAL_ALREADY_EXISTS';
      throw error;
    }

    // Verificar se o usuário tem permissão
    const user = User.findByEmail(restoredBy);
    if (!user || user.role !== 'admin') {
      const error = new Error('Apenas administradores podem restaurar aprovações');
      error.code = 'INSUFFICIENT_PERMISSIONS';
      throw error;
    }

    // Criar nova aprovação com status 'pending'
    const restoredApproval = {
      id: approvalId, // Usar o mesmo ID
      type: deletedApproval.type,
      amount: deletedApproval.amount,
      requester: deletedApproval.requester,
      description: deletedApproval.description,
      approver: deletedApproval.approver,
      status: 'pending', // Sempre restaurar como pendente
      createdAt: deletedApproval.createdAt,
      updatedAt: new Date().toISOString()
    };

    try {
      databaseService.createApproval(restoredApproval);
      
      // Registrar log de auditoria para restauração
      await auditService.createAuditLog({
        approver: restoredBy,
        action: 'restored',
        timestamp: new Date().toISOString(),
        comment: `Aprovação restaurada por ${restoredBy} - Status original: ${deletedApproval.status}`,
        approvalID: approvalId,
        isUpdate: false,
        restoredApproval: {
          originalStatus: deletedApproval.status,
          restoredStatus: 'pending'
        }
      });
      
      logger.info('Aprovação restaurada', {
        approvalID: approvalId,
        type: deletedApproval.type,
        requester: deletedApproval.requester,
        restoredBy: restoredBy,
        originalStatus: deletedApproval.status,
        newStatus: 'pending'
      });

      return restoredApproval;
    } catch (error) {
      logger.error('Erro ao restaurar aprovação', {
        error: error.message,
        approvalId,
        restoredBy: restoredBy
      });
      throw error;
    }
  }

  clearData() {
    databaseService.clearAllData();
  }
}

module.exports = new ApprovalService(); 