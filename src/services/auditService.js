const { v4: uuidv4 } = require('uuid');
const { auditLogger } = require('../utils/logger');
const databaseService = require('./database');
const PDFDocument = require('pdfkit');

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
    console.log('=== DEBUG getAuditLogs ===');
    console.log('Filtros recebidos:', filters);
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
    
    console.log('=== EXPORT AUDIT LOGS ===');
    console.log('Período solicitado:', { startDate, endDate });
    
    // Ajustar período para incluir dados existentes
    const adjustedPeriod = await this.adjustPeriodToIncludeData(startDate, endDate);
    console.log('Período ajustado:', adjustedPeriod);
    
    console.log('Buscando logs com período ajustado:', {
      startDate: adjustedPeriod.startDate,
      endDate: adjustedPeriod.endDate
    });
    
    const logs = await this.getAuditLogs({ 
      startDate: adjustedPeriod.startDate, 
      endDate: adjustedPeriod.endDate 
    });

    console.log('Logs encontrados para exportação:', logs.length);
    
    if (logs.length > 0) {
      console.log('Primeiro log:', logs[0].timestamp);
      console.log('Último log:', logs[logs.length - 1].timestamp);
    }
    
    // Sempre gerar arquivo, mesmo sem dados
    if (logs.length === 0) {
      console.log('Nenhum log encontrado, gerando arquivo vazio com informações do período');
    }

    if (format === 'csv') {
      console.log('Gerando CSV...');
      const result = await this.generateCSV(logs, adjustedPeriod);
      console.log('CSV gerado, tamanho:', result.length, 'bytes');
      return result;
    } else if (format === 'pdf') {
      console.log('Gerando PDF...');
      const result = await this.generatePDF(logs, adjustedPeriod);
      console.log('PDF gerado, tamanho:', result.length, 'bytes');
      return result;
    }

    throw new Error('Formato não suportado');
  }

  async adjustPeriodToIncludeData(startDate, endDate) {
    console.log('=== AJUSTANDO PERÍODO ===');
    console.log('Período original:', { startDate, endDate });
    
    // Buscar primeiro e último log disponível
    const allLogs = await this.getAuditLogs({});
    
    if (allLogs.length === 0) {
      // Se não há logs, usar período padrão
      const today = new Date().toISOString().split('T')[0];
      return {
        startDate: today,
        endDate: today,
        originalStartDate: startDate,
        originalEndDate: endDate,
        adjusted: true
      };
    }
    
    // Ordenar logs por timestamp
    const sortedLogs = allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const firstLog = sortedLogs[0];
    const lastLog = sortedLogs[sortedLogs.length - 1];
    
    console.log('Primeiro log disponível:', firstLog.timestamp);
    console.log('Último log disponível:', lastLog.timestamp);
    
    // Se não foi especificado período, usar todo o período disponível
    if (!startDate && !endDate) {
      return {
        startDate: firstLog.timestamp.split('T')[0],
        endDate: lastLog.timestamp.split('T')[0],
        originalStartDate: null,
        originalEndDate: null,
        adjusted: true
      };
    }
    
    // Verificar se há dados para o período solicitado
    if (startDate && endDate) {
      const logsForPeriod = await this.getAuditLogs({ startDate, endDate });
      console.log('Logs encontrados para o período solicitado:', logsForPeriod.length);
      
      // Se há dados para o período solicitado, usar o período original
      if (logsForPeriod.length > 0) {
        console.log('Período solicitado tem dados, mantendo período original');
        return {
          startDate: startDate,
          endDate: endDate,
          originalStartDate: startDate,
          originalEndDate: endDate,
          adjusted: false
        };
      }
    }
    
    // Se não há dados para o período solicitado, encontrar o período mais próximo com dados
    console.log('Período solicitado não tem dados, buscando período mais próximo com dados');
    
    const requestedStartDate = startDate ? new Date(startDate) : new Date(firstLog.timestamp);
    const requestedEndDate = endDate ? new Date(endDate) : new Date(lastLog.timestamp);
    
    // Encontrar logs dentro do período solicitado ou o mais próximo
    let availableLogs = [];
    let adjustedStartDate = startDate;
    let adjustedEndDate = endDate;
    
    // Buscar logs que estejam dentro do período solicitado
    if (startDate && endDate) {
      availableLogs = sortedLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= requestedStartDate && logDate <= requestedEndDate;
      });
      
      console.log('Logs encontrados dentro do período solicitado:', availableLogs.length);
      
      if (availableLogs.length > 0) {
        // Se há logs dentro do período, usar o período original
        console.log('Usando período original com dados disponíveis');
        return {
          startDate: startDate,
          endDate: endDate,
          originalStartDate: startDate,
          originalEndDate: endDate,
          adjusted: false
        };
      }
    }
    
    // Se não há logs dentro do período, encontrar o período mais próximo com dados
    console.log('Nenhum log dentro do período solicitado, buscando período mais próximo');
    console.log('Período solicitado:', { startDate, endDate });
    console.log('Dados disponíveis:', { 
      firstLog: firstLog.timestamp, 
      lastLog: lastLog.timestamp 
    });
    
    // Encontrar o log mais próximo do início do período solicitado
    let closestStartLog = firstLog;
    let minStartDiff = Math.abs(requestedStartDate - new Date(firstLog.timestamp));
    
    sortedLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const diff = Math.abs(requestedStartDate - logDate);
      if (diff < minStartDiff) {
        minStartDiff = diff;
        closestStartLog = log;
      }
    });
    
    // Encontrar o log mais próximo do fim do período solicitado
    let closestEndLog = lastLog;
    let minEndDiff = Math.abs(requestedEndDate - new Date(lastLog.timestamp));
    
    sortedLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const diff = Math.abs(requestedEndDate - logDate);
      if (diff < minEndDiff) {
        minEndDiff = diff;
        closestEndLog = log;
      }
    });
    
    console.log('Logs mais próximos encontrados:', {
      closestStartLog: closestStartLog.timestamp,
      closestEndLog: closestEndLog.timestamp
    });
    
    // Ajustar datas baseado nos logs mais próximos
    // Se o período solicitado está completamente fora dos dados disponíveis,
    // usar todo o período disponível
    if (requestedStartDate > new Date(lastLog.timestamp) || requestedEndDate < new Date(firstLog.timestamp)) {
      console.log('Período solicitado está completamente fora dos dados disponíveis, usando todo o período');
      adjustedStartDate = firstLog.timestamp.split('T')[0];
      adjustedEndDate = lastLog.timestamp.split('T')[0];
    } else {
      // Usar os logs mais próximos
      adjustedStartDate = closestStartLog.timestamp.split('T')[0];
      adjustedEndDate = closestEndLog.timestamp.split('T')[0];
    }
    
    console.log('Período ajustado para o mais próximo com dados:', { 
      adjustedStartDate, 
      adjustedEndDate,
      closestStartLog: closestStartLog.timestamp,
      closestEndLog: closestEndLog.timestamp
    });
    
    return {
      startDate: adjustedStartDate,
      endDate: adjustedEndDate,
      originalStartDate: startDate,
      originalEndDate: endDate,
      adjusted: true
    };
  }

  async generateCSV(logs, periodInfo = null) {
    console.log('Gerando CSV com', logs.length, 'logs');
    console.log('Informações do período:', periodInfo);
    
    // Cabeçalhos das colunas (sem acentos para evitar problemas de codificação)
    const headers = [
      'ID da Aprovacao',
      'Tipo de Solicitacao', 
      'Solicitante',
      'Aprovador',
      'Acao Realizada',
      'Justificativa',
      'Data/Hora',
      'Duracao do Processo'
    ];
    
    // Processar dados dos logs com informações mais úteis
    const rows = await Promise.all(logs.map(async (log, index) => {
      console.log(`Processando log ${index}:`, log);
      
      let metadata = {};
      if (typeof log.metadata === 'string') {
        try {
          metadata = JSON.parse(log.metadata);
        } catch (error) {
          console.error(`Erro ao parsear metadata do log ${index}:`, error);
          metadata = {};
        }
      } else {
        metadata = log.metadata || {};
      }

      const deletedApproval = metadata.deletedApproval || {};
      
      // Buscar o tipo real da solicitação
      let requestType = 'N/A';
      if (log.approvalId) {
        try {
          // Tentar buscar a aprovação original no banco
          const approval = await databaseService.findApprovalById(log.approvalId);
          if (approval && approval.type) {
            requestType = approval.type;
          } else if (deletedApproval.type) {
            requestType = deletedApproval.type;
          }
        } catch (error) {
          console.error(`Erro ao buscar aprovação ${log.approvalId}:`, error);
          if (deletedApproval.type) {
            requestType = deletedApproval.type;
          }
        }
      } else if (deletedApproval.type) {
        requestType = deletedApproval.type;
      }
      
      // Calcular duração do processo se houver dados de criação
      let processDuration = 'N/A';
      if (metadata.createdAt && log.timestamp) {
        const createdDate = new Date(metadata.createdAt);
        const actionDate = new Date(log.timestamp);
        const durationMs = actionDate - createdDate;
        const durationHours = Math.round(durationMs / (1000 * 60 * 60));
        const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
        
        if (durationDays > 0) {
          processDuration = `${durationDays} dia(s)`;
        } else if (durationHours > 0) {
          processDuration = `${durationHours} hora(s)`;
        } else {
          const durationMinutes = Math.round(durationMs / (1000 * 60));
          processDuration = `${durationMinutes} minuto(s)`;
        }
      }
      
      // Melhorar justificativa com informações mais úteis
      let enhancedJustification = log.comment || '-';
      if (log.action === 'deleted' && metadata.deletedApproval) {
        enhancedJustification = `Aprovacao deletada - Tipo: ${metadata.deletedApproval.type || 'N/A'}, Solicitante: ${metadata.deletedApproval.requester || 'N/A'}`;
      } else if (log.action === 'restored' && metadata.restoredApproval) {
        enhancedJustification = `Aprovacao restaurada - Status anterior: ${metadata.restoredApproval.previousStatus || 'N/A'}`;
      } else if (log.action === 'approved') {
        enhancedJustification = log.comment || 'Aprovado via sistema';
      } else if (log.action === 'rejected') {
        enhancedJustification = log.comment || 'Rejeitado via sistema';
      }
      
      // Formatar dados para CSV com informações mais úteis
      const row = [
        log.approvalId ? log.approvalId.substring(0, 12) + '...' : 'N/A',
        this.formatRequestType(requestType),
        this.formatEmail(deletedApproval.requester || log.approver),
        this.formatEmail(log.approver),
        this.formatAction(log.action),
        enhancedJustification,
        log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : 'N/A',
        processDuration
      ];
      
      console.log(`Linha ${index} gerada:`, row);
      return row;
    }));

    // Construir conteúdo CSV com formatação correta
    const csvLines = [];
    
    // Adicionar cabeçalho como uma única linha (garantir que não há quebras)
    const cleanHeaders = headers.map(header => header.replace(/[\r\n\s]+/g, ' ').trim());
    const headerLine = cleanHeaders.join(',');
    csvLines.push(headerLine);
    
    // Adicionar linhas de dados
    rows.forEach(row => {
      const escapedRow = row.map(field => {
        // Escapar aspas duplas e quebras de linha
        const escapedField = String(field)
          .replace(/"/g, '""')  // Duplicar aspas para escape
          .replace(/\n/g, ' ')  // Substituir quebras de linha por espaço
          .replace(/\r/g, ' ')  // Substituir retornos por espaço
          .trim(); // Remover espaços extras
        return `"${escapedField}"`;
      });
      csvLines.push(escapedRow.join(','));
    });

    const csvContent = csvLines.join('\n');
    console.log('CSV gerado com sucesso, tamanho:', csvContent.length);
    console.log('Primeiras linhas do CSV:', csvContent.substring(0, 500));
    
    // Adicionar BOM para UTF-8 e retornar
    const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
    return Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);
  }

  async generatePDF(logs, periodInfo = null) {
    console.log('Gerando PDF com', logs.length, 'logs');
    console.log('Informações do período:', periodInfo);
    
    return new Promise(async (resolve, reject) => {
      try {
        // Criar documento PDF com melhor formatação
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          autoFirstPage: true
        });
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log('PDF gerado com sucesso, tamanho:', buffer.length);
          resolve(buffer);
        });
        doc.on('error', (error) => {
          console.error('Erro ao gerar PDF:', error);
          reject(error);
        });

        // Cabeçalho do relatório melhorado
        doc.fontSize(20).font('Helvetica-Bold').text('RELATÓRIO DE AUDITORIA', { align: 'center' });
        doc.moveDown(0.5);
        
        // Informações de geração
        doc.fontSize(10).font('Helvetica').text(`Data de geração: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.fontSize(10).text(`Total de registros: ${logs.length}`, { align: 'center' });
        
        // Informações do período
        if (periodInfo) {
          doc.moveDown(0.5);
          if (periodInfo.adjusted) {
            doc.fontSize(9).text(`Período ajustado: ${periodInfo.startDate} a ${periodInfo.endDate}`, { align: 'center' });
            if (periodInfo.originalStartDate || periodInfo.originalEndDate) {
              doc.fontSize(9).text(`Período solicitado: ${periodInfo.originalStartDate || 'N/A'} a ${periodInfo.originalEndDate || 'N/A'}`, { align: 'center' });
            }
          } else {
            doc.fontSize(9).text(`Período: ${periodInfo.startDate} a ${periodInfo.endDate}`, { align: 'center' });
          }
        }
        
        doc.moveDown(1);

        if (logs.length === 0) {
          doc.fontSize(12).text('Nenhum log encontrado para o período selecionado.', { align: 'center' });
          doc.end();
          return;
        }

        // Criar tabela de logs melhorada
        const tableTop = doc.y;
        const pageWidth = doc.page.width - 80;
        
        // Definir larguras das colunas (removendo redundâncias)
        const columnWidths = [
          pageWidth * 0.15, // ID da Aprovação
          pageWidth * 0.15, // Tipo de Solicitação
          pageWidth * 0.18, // Solicitante
          pageWidth * 0.18, // Aprovador
          pageWidth * 0.12, // Ação Realizada
          pageWidth * 0.22  // Justificativa
        ];
        
        const rowHeight = 25;
        const headerHeight = 30;

        // Cabeçalhos da tabela melhorados
        const headers = [
          'ID da Aprovação',
          'Tipo de Solicitação',
          'Solicitante', 
          'Aprovador',
          'Ação Realizada',
          'Justificativa'
        ];

        // Desenhar cabeçalhos com melhor formatação
        let currentX = 40;
        headers.forEach((header, i) => {
          const x = currentX;
          const y = tableTop;
          
          // Fundo do cabeçalho
          doc.rect(x, y, columnWidths[i], headerHeight).fill('#2c3e50');
          
          // Texto do cabeçalho
          doc.fontSize(9).font('Helvetica-Bold').fillColor('white');
          doc.text(header, x + 3, y + 10, { width: columnWidths[i] - 6 });
          
          currentX += columnWidths[i];
        });

        // Linha separadora
        doc.moveTo(40, tableTop + headerHeight).lineTo(40 + pageWidth, tableTop + headerHeight).stroke();

        // Dados dos logs
        let currentY = tableTop + headerHeight;
        let pageNumber = 1;

        for (let index = 0; index < logs.length; index++) {
          const log = logs[index];
          console.log(`Processando log ${index} para PDF:`, log);
          
          // Verificar se precisa de nova página
          if (currentY > doc.page.height - 120) {
            doc.addPage();
            currentY = 40;
            pageNumber++;
            
            // Adicionar cabeçalho na nova página
            doc.fontSize(10).font('Helvetica-Bold').text(`Página ${pageNumber}`, { align: 'center' });
            doc.moveDown(0.5);
          }
          
        let metadata = {};
        if (typeof log.metadata === 'string') {
          try {
            metadata = JSON.parse(log.metadata);
          } catch (error) {
              console.error(`Erro ao parsear metadata do log ${index}:`, error);
            metadata = {};
          }
        } else {
          metadata = log.metadata || {};
        }

        const deletedApproval = metadata.deletedApproval || {};
        
          // Buscar o tipo real da solicitação
          let requestType = 'N/A';
          if (log.approvalId) {
            try {
              // Tentar buscar a aprovação original no banco
              const approval = await databaseService.findApprovalById(log.approvalId);
              if (approval && approval.type) {
                requestType = approval.type;
              } else if (deletedApproval.type) {
                requestType = deletedApproval.type;
              }
            } catch (error) {
              console.error(`Erro ao buscar aprovação ${log.approvalId}:`, error);
              if (deletedApproval.type) {
                requestType = deletedApproval.type;
              }
            }
          } else if (deletedApproval.type) {
            requestType = deletedApproval.type;
          }
          
          // Calcular duração do processo
          let processDuration = 'N/A';
          if (metadata.createdAt && log.timestamp) {
            const createdDate = new Date(metadata.createdAt);
            const actionDate = new Date(log.timestamp);
            const durationMs = actionDate - createdDate;
            const durationHours = Math.round(durationMs / (1000 * 60 * 60));
            const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24));
            
            if (durationDays > 0) {
              processDuration = `${durationDays} dia(s)`;
            } else if (durationHours > 0) {
              processDuration = `${durationHours} hora(s)`;
            } else {
              const durationMinutes = Math.round(durationMs / (1000 * 60));
              processDuration = `${durationMinutes} minuto(s)`;
            }
          }
          
          // Melhorar justificativa
          let enhancedJustification = log.comment || '-';
          if (log.action === 'deleted' && metadata.deletedApproval) {
            enhancedJustification = `Deletado - Tipo: ${metadata.deletedApproval.type || 'N/A'}`;
          } else if (log.action === 'restored' && metadata.restoredApproval) {
            enhancedJustification = `Restaurado - Status anterior: ${metadata.restoredApproval.previousStatus || 'N/A'}`;
          } else if (log.action === 'approved') {
            enhancedJustification = log.comment || 'Aprovado via sistema';
          } else if (log.action === 'rejected') {
            enhancedJustification = log.comment || 'Rejeitado via sistema';
          }
          
          // Dados da linha melhorados
          const rowData = [
            log.approvalId ? log.approvalId.substring(0, 12) + '...' : 'N/A',
            this.formatRequestType(requestType),
            this.formatEmail(deletedApproval.requester || log.approver),
            this.formatEmail(log.approver),
            this.formatAction(log.action),
            enhancedJustification
          ];

          console.log(`Linha ${index} para PDF:`, rowData);

          // Desenhar linha de dados com melhor formatação
          currentX = 40;
          rowData.forEach((cell, i) => {
            const x = currentX;
            
            // Fundo da célula (alternando cores)
            const fillColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(x, currentY, columnWidths[i], rowHeight).fill(fillColor);
            
            // Borda da célula
            doc.rect(x, currentY, columnWidths[i], rowHeight).stroke('#dee2e6');
            
            // Texto da célula
            doc.fontSize(8).font('Helvetica').fillColor('black');
            doc.text(cell, x + 3, currentY + 8, { width: columnWidths[i] - 6 });
            
            currentX += columnWidths[i];
          });

          currentY += rowHeight;
        }

        // Rodapé
        doc.fontSize(10).text(`Página ${pageNumber}`, { align: 'center' });
        
        doc.end();
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        reject(error);
      }
    });
  }

  // Métodos auxiliares para formatação
  formatRequestType(type) {
    if (!type) return 'N/A';
    
    const typeMap = {
      'approved': 'Aprovação',
      'rejected': 'Rejeição',
      'deleted': 'Exclusão',
      'restored': 'Restauração',
      'reimbursement': 'Reembolso',
      'vacation': 'Férias',
      'purchase': 'Compra',
      'expense': 'Despesa'
    };
    
    return typeMap[type] || type;
  }

  formatEmail(email) {
    if (!email) return 'N/A';
    
    // Mostrar apenas o nome do usuário se for um email
    if (email.includes('@')) {
      const username = email.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1);
    }
    
    return email;
  }

  formatAction(action) {
    if (!action) return 'N/A';
    
    const actionMap = {
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'deleted': 'Deletado',
      'restored': 'Restaurado',
      'created': 'Criado',
      'updated': 'Atualizado'
    };
    
    return actionMap[action] || action;
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