const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../utils/logger');
const databaseService = require('./database');

class AuditService {
  async createAuditLog(data) {
    const auditEntry = {
      id: uuidv4(),
      approver: data.approver,
      action: data.action,
      timestamp: data.timestamp || new Date().toISOString(),
      comment: data.comment || '',
      approvalId: data.approvalID,
      metadata: {
        isUpdate: data.isUpdate || false,
        deletedApproval: data.deletedApproval || null
      }
    };

    // Debug para logs de exclusão
    if (data.action === 'deleted') {
      console.log('Criando log de exclusão:', {
        approvalId: auditEntry.approvalId,
        deletedApproval: auditEntry.metadata.deletedApproval,
        metadataString: JSON.stringify(auditEntry.metadata)
      });
    }

    try {
      databaseService.createAuditLog(auditEntry);
      
      // Log específico para auditoria
      auditLogger.info('Log de auditoria criado', {
        logID: auditEntry.id,
        approver: auditEntry.approver,
        action: auditEntry.action,
        approvalId: auditEntry.approvalId,
        timestamp: auditEntry.timestamp,
        isUpdate: auditEntry.metadata.isUpdate,
        hasDeletedApproval: !!auditEntry.metadata.deletedApproval
      });

      return auditEntry;
    } catch (error) {
      auditLogger.error('Erro ao criar log de auditoria', {
        error: error.message,
        data
      });
      throw error;
    }
  }

  async getAuditLogs(filters = {}) {
    try {
      return databaseService.findAuditLogs(filters);
    } catch (error) {
      auditLogger.error('Erro ao buscar logs de auditoria', {
        error: error.message,
        filters
      });
      throw error;
    }
  }

  async exportAuditLogs(options) {
    const { format, startDate, endDate } = options;
    
    const logs = await this.getAuditLogs({ startDate, endDate });

    if (format === 'csv') {
      return this.generateCSV(logs);
    } else if (format === 'pdf') {
      return this.generatePDF(logs);
    }

    throw new Error('Formato não suportado');
  }

  async generateCSV(logs) {
    const headers = ['ID', 'Tipo', 'Solicitante', 'Aprovador', 'Status', 'Justificativa', 'Data', 'Ação'];
    const rows = logs.map(log => {
      let metadata = {};
      if (typeof log.metadata === 'string') {
        try {
          metadata = JSON.parse(log.metadata);
        } catch (error) {
          metadata = {};
        }
      } else {
        metadata = log.metadata || {};
      }

      const deletedApproval = metadata.deletedApproval || {};
      
      return [
        log.approvalId ? log.approvalId.substring(0, 8) + '...' : 'N/A',
        deletedApproval.type || 'N/A',
        deletedApproval.requester || 'N/A',
        log.approver || 'N/A',
        log.action || 'N/A',
        log.comment || '-',
        log.timestamp || 'N/A',
        log.action || 'N/A'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  async generatePDF(logs) {
    // Implementação básica de PDF (em produção, usar biblioteca como PDFKit)
    const pdfContent = `
      Relatório de Auditoria
      ====================
      
      Data de geração: ${new Date().toLocaleString('pt-BR')}
      Total de logs: ${logs.length}
      
      ${logs.map((log, index) => {
        let metadata = {};
        if (typeof log.metadata === 'string') {
          try {
            metadata = JSON.parse(log.metadata);
          } catch (error) {
            metadata = {};
          }
        } else {
          metadata = log.metadata || {};
        }

        const deletedApproval = metadata.deletedApproval || {};
        
        return `
        Log ${index + 1}:
        - ID: ${log.approvalId ? log.approvalId.substring(0, 8) + '...' : 'N/A'}
        - Tipo: ${deletedApproval.type || 'N/A'}
        - Solicitante: ${deletedApproval.requester || 'N/A'}
        - Aprovador: ${log.approver || 'N/A'}
        - Ação: ${log.action || 'N/A'}
        - Data: ${log.timestamp || 'N/A'}
        - Comentário: ${log.comment || '-'}
        - Descrição: ${deletedApproval.description || 'N/A'}
        `;
      }).join('\n')}
    `;

    return Buffer.from(pdfContent, 'utf-8');
  }

  async getAuditStats() {
    try {
      const logs = await this.getAuditLogs();
      
      const stats = {
        total: logs.length,
        byAction: {},
        byApprover: {},
        recentActivity: logs
          .filter(log => new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000))
          .length
      };

      logs.forEach(log => {
        // Contagem por ação
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        
        // Contagem por aprovador
        stats.byApprover[log.approver] = (stats.byApprover[log.approver] || 0) + 1;
      });

      return stats;
    } catch (error) {
      auditLogger.error('Erro ao buscar estatísticas de auditoria', {
        error: error.message
      });
      throw error;
    }
  }

  clearData() {
    try {
      databaseService.clearAllData();
      auditLogger.info('Dados de auditoria limpos');
    } catch (error) {
      auditLogger.error('Erro ao limpar dados de auditoria', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new AuditService(); 