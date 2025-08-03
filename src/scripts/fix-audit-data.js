const databaseService = require('../services/database');

console.log('=== CORRIGINDO DADOS DE AUDITORIA ===');

try {
  // Limpar todos os logs de auditoria existentes
  console.log('\nLimpando logs de auditoria antigos...');
  databaseService.db.exec('DELETE FROM audit_logs');
  
  console.log('Logs de auditoria limpos com sucesso!');
  console.log('\nAgora você pode:');
  console.log('1. Criar novas aprovações');
  console.log('2. Aprovar/rejeitar algumas');
  console.log('3. Testar os botões de alteração nos logs de auditoria');
  
} catch (error) {
  console.error('Erro ao corrigir dados:', error);
}

console.log('\n=== CORREÇÃO CONCLUÍDA ==='); 