const databaseService = require('../src/services/database');

async function checkAuditData() {
  try {
    await databaseService.initialize();
    
    console.log('=== VERIFICAÇÃO DE DADOS DE AUDITORIA ===');
    
    // Verificar estatísticas
    const stats = databaseService.getStats();
    console.log('Estatísticas:', stats);
    
    // Verificar todos os logs de auditoria
    const allLogs = databaseService.findAuditLogs({});
    console.log('Total de logs encontrados:', allLogs.length);
    
    if (allLogs.length > 0) {
      console.log('Primeiros 5 logs:');
      allLogs.slice(0, 5).forEach((log, index) => {
        console.log(`Log ${index + 1}:`, {
          id: log.id,
          approver: log.approver,
          action: log.action,
          timestamp: log.timestamp,
          approvalId: log.approvalId,
          comment: log.comment,
          metadata: log.metadata
        });
      });
    }
    
    // Verificar logs por período específico
    const startDate = '2025-07-01';
    const endDate = '2025-08-31';
    console.log(`\nVerificando logs entre ${startDate} e ${endDate}:`);
    const filteredLogs = databaseService.findAuditLogs({ startDate, endDate });
    console.log('Logs filtrados:', filteredLogs.length);
    
    databaseService.close();
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  }
}

checkAuditData(); 