const databaseService = require('../services/database');

console.log('=== VERIFICANDO APROVAÇÕES CRIADAS ===');

try {
  // Contar total de aprovações
  const totalCount = databaseService.db.prepare('SELECT COUNT(*) as count FROM approvals').get().count;
  console.log(`\nTotal de aprovações: ${totalCount}`);
  
  if (totalCount > 0) {
    // Contar por status
    const pendingCount = databaseService.db.prepare("SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'").get().count;
    const approvedCount = databaseService.db.prepare("SELECT COUNT(*) as count FROM approvals WHERE status = 'approved'").get().count;
    const rejectedCount = databaseService.db.prepare("SELECT COUNT(*) as count FROM approvals WHERE status = 'rejected'").get().count;
    
    console.log('\nPor status:');
    console.log(`  - Pendentes: ${pendingCount}`);
    console.log(`  - Aprovadas: ${approvedCount}`);
    console.log(`  - Rejeitadas: ${rejectedCount}`);
    
    // Contar por tipo
    const purchaseCount = databaseService.db.prepare("SELECT COUNT(*) as count FROM approvals WHERE type = 'purchase'").get().count;
    const reimbursementCount = databaseService.db.prepare("SELECT COUNT(*) as count FROM approvals WHERE type = 'reimbursement'").get().count;
    const vacationCount = databaseService.db.prepare("SELECT COUNT(*) as count FROM approvals WHERE type = 'vacation'").get().count;
    
    console.log('\nPor tipo:');
    console.log(`  - Compras: ${purchaseCount}`);
    console.log(`  - Reembolsos: ${reimbursementCount}`);
    console.log(`  - Férias: ${vacationCount}`);
    
    // Mostrar algumas aprovações de exemplo
    console.log('\n=== EXEMPLOS DE APROVAÇÕES ===');
    const examples = databaseService.db.prepare('SELECT * FROM approvals ORDER BY createdAt DESC LIMIT 5').all();
    
    examples.forEach((approval, index) => {
      console.log(`\nAprovação ${index + 1}:`);
      console.log(`  ID: ${approval.id.substring(0, 8)}...`);
      console.log(`  Tipo: ${approval.type}`);
      console.log(`  Status: ${approval.status}`);
      console.log(`  Solicitante: ${approval.requester}`);
      console.log(`  Aprovador: ${approval.approver}`);
      console.log(`  Valor: ${approval.amount ? `R$ ${approval.amount}` : 'N/A'}`);
      console.log(`  Descrição: ${approval.description.substring(0, 50)}...`);
    });
  }
  
  // Verificar logs de auditoria
  const auditCount = databaseService.db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  console.log(`\nLogs de auditoria: ${auditCount}`);
  
} catch (error) {
  console.error('Erro ao verificar aprovações:', error);
}

console.log('\n=== VERIFICAÇÃO CONCLUÍDA ==='); 