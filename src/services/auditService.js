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
    
    // Cabeçalhos das colunas (usando BOM para UTF-8)
    const headers = [
      'ID da Aprovacao',
      'Tipo de Solicitacao', 
      'Solicitante',
      'Aprovador',
      'Acao Realizada',
      'Justificativa',
      'Data/Hora',
      'Status'
    ];
    
    // Processar dados dos logs
    const rows = logs.map((log, index) => {
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
      
      // Formatar dados para CSV
      const row = [
        log.approvalId ? log.approvalId.substring(0, 8) + '...' : 'N/A',
        deletedApproval.type || log.action || 'N/A',
        deletedApproval.requester || log.approver || 'N/A',
        log.approver || 'N/A',
        log.action || 'N/A',
        log.comment || '-',
        log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : 'N/A',
        log.action || 'N/A'
      ];
      
      console.log(`Linha ${index} gerada:`, row);
      return row;
    });

    // Construir conteúdo CSV (apenas dados, sem cabeçalho de relatório)
    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ];

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
    
    return new Promise((resolve, reject) => {
      try {
        // Criar documento PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
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

        // Cabeçalho do relatório
        doc.fontSize(24).font('Helvetica-Bold').text('RELATÓRIO DE AUDITORIA', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).font('Helvetica').text(`Data de geração: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
        doc.fontSize(12).text(`Total de registros: ${logs.length}`, { align: 'center' });
        
        // Informações do período
        if (periodInfo) {
          doc.moveDown();
          if (periodInfo.adjusted) {
            doc.fontSize(10).text(`Período ajustado: ${periodInfo.startDate} a ${periodInfo.endDate}`, { align: 'center' });
            if (periodInfo.originalStartDate || periodInfo.originalEndDate) {
              doc.fontSize(10).text(`Período solicitado: ${periodInfo.originalStartDate || 'N/A'} a ${periodInfo.originalEndDate || 'N/A'}`, { align: 'center' });
            }
          } else {
            doc.fontSize(10).text(`Período: ${periodInfo.startDate} a ${periodInfo.endDate}`, { align: 'center' });
          }
        }
        
        doc.moveDown(2);

        if (logs.length === 0) {
          doc.fontSize(14).text('Nenhum log encontrado para o período selecionado.', { align: 'center' });
          doc.end();
          return;
        }

        // Criar tabela de logs
        const tableTop = doc.y;
        const pageWidth = doc.page.width - 100;
        const colWidth = pageWidth / 8;
        const rowHeight = 20;

        // Cabeçalhos da tabela
        const headers = [
          'ID da Aprovação',
          'Tipo de Solicitação',
          'Solicitante', 
          'Aprovador',
          'Ação Realizada',
          'Justificativa',
          'Data/Hora',
          'Status'
        ];

        // Desenhar cabeçalhos
        headers.forEach((header, i) => {
          const x = 50 + (i * colWidth);
          const y = tableTop;
          
          // Fundo do cabeçalho
          doc.rect(x, y, colWidth, rowHeight).fill('#f0f0f0');
          
          // Texto do cabeçalho
          doc.fontSize(8).font('Helvetica-Bold').fillColor('black');
          doc.text(header, x + 2, y + 6, { width: colWidth - 4 });
        });

        // Linha separadora
        doc.moveTo(50, tableTop + rowHeight).lineTo(50 + pageWidth, tableTop + rowHeight).stroke();

        // Dados dos logs
        let currentY = tableTop + rowHeight;
        let pageNumber = 1;

        logs.forEach((log, index) => {
          console.log(`Processando log ${index} para PDF:`, log);
          
          // Verificar se precisa de nova página
          if (currentY > doc.page.height - 150) {
            doc.addPage();
            currentY = 50;
            pageNumber++;
            
            // Adicionar cabeçalho na nova página
            doc.fontSize(10).text(`Página ${pageNumber}`, { align: 'center' });
            doc.moveDown();
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
          
          // Dados da linha
          const rowData = [
            log.approvalId ? log.approvalId.substring(0, 8) + '...' : 'N/A',
            deletedApproval.type || log.action || 'N/A',
            deletedApproval.requester || log.approver || 'N/A',
            log.approver || 'N/A',
            log.action || 'N/A',
            log.comment || '-',
            log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : 'N/A',
            log.action || 'N/A'
          ];

          console.log(`Linha ${index} para PDF:`, rowData);

          // Desenhar linha de dados
          rowData.forEach((cell, i) => {
            const x = 50 + (i * colWidth);
            
            // Fundo da célula (alternando cores)
            const fillColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
            doc.rect(x, currentY, colWidth, rowHeight).fill(fillColor);
            
            // Texto da célula
            doc.fontSize(7).font('Helvetica').fillColor('black');
            doc.text(cell, x + 2, currentY + 6, { width: colWidth - 4 });
          });

          currentY += rowHeight;
        });

        // Rodapé
        doc.fontSize(10).text(`Página ${pageNumber}`, { align: 'center' });
        
        doc.end();
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        reject(error);
      }
    });
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