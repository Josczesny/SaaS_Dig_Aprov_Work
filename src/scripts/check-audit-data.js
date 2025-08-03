const databaseService = require('../services/database');

console.log('=== VERIFICANDO DADOS DE AUDITORIA ===');

try {
  // Buscar todos os logs de auditoria
  const logs = databaseService.findAuditLogs();
  
  console.log(`\nTotal de logs encontrados: ${logs.length}`);
  
  if (logs.length > 0) {
    console.log('\n=== PRIMEIROS 5 LOGS ===');
    logs.slice(0, 5).forEach((log, index) => {
      console.log(`\nLog ${index + 1}:`);
      console.log('  ID:', log.id);
      console.log('  Aprovador:', log.approver);
      console.log('  Ação:', log.action);
      console.log('  Timestamp:', log.timestamp);
      console.log('  Comentário:', log.comment);
      console.log('  approvalId:', log.approvalId);
      console.log('  approvalID:', log.approvalID);
      console.log('  Metadata:', log.metadata);
    });
    
    // Verificar se há logs com approvalId null
    const nullApprovalIds = logs.filter(log => !log.approvalId);
    console.log(`\nLogs com approvalId null: ${nullApprovalIds.length}`);
    
    if (nullApprovalIds.length > 0) {
      console.log('\n=== LOGS COM APPROVALID NULL ===');
      nullApprovalIds.slice(0, 3).forEach((log, index) => {
        console.log(`\nLog com problema ${index + 1}:`);
        console.log('  ID:', log.id);
        console.log('  Ação:', log.action);
        console.log('  approvalId:', log.approvalId);
        console.log('  approvalID:', log.approvalID);
      });
    }
  }
  
  // Verificar estrutura da tabela
  console.log('\n=== ESTRUTURA DA TABELA AUDIT_LOGS ===');
  const tableInfo = databaseService.db.prepare("PRAGMA table_info(audit_logs)").all();
  tableInfo.forEach(column => {
    console.log(`  ${column.name}: ${column.type}`);
  });
  
} catch (error) {
  console.error('Erro ao verificar dados:', error);
}

console.log('\n=== VERIFICAÇÃO CONCLUÍDA ==='); 