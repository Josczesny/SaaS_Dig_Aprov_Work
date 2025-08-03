const { v4: uuidv4 } = require('uuid');
const databaseService = require('../services/database');
const approvalService = require('../services/approvalService');
const auditService = require('../services/auditService');

console.log('=== GERANDO 100 APROVAÇÕES DIVERSAS ===');

const types = ['purchase', 'reimbursement', 'vacation'];
const requesters = [
  'joao.silva@empresa.com',
  'maria.santos@empresa.com', 
  'pedro.oliveira@empresa.com',
  'ana.costa@empresa.com',
  'carlos.rodrigues@empresa.com',
  'julia.ferreira@empresa.com',
  'lucas.almeida@empresa.com',
  'sophia.martins@empresa.com',
  'gabriel.lima@empresa.com',
  'isabella.gomes@empresa.com'
];

const approvers = [
  'admin@empresa.com',
  'manager@empresa.com',
  'approver@empresa.com'
];

const descriptions = [
  'Compra de equipamentos de escritório',
  'Reembolso de viagem a negócios',
  'Solicitação de férias',
  'Aquisição de software',
  'Reembolso de despesas com alimentação',
  'Compra de material de limpeza',
  'Reembolso de transporte',
  'Solicitação de férias antecipadas',
  'Compra de uniformes',
  'Reembolso de hospedagem',
  'Aquisição de licenças',
  'Compra de mobiliário',
  'Reembolso de combustível',
  'Solicitação de férias prêmio',
  'Compra de equipamentos de TI',
  'Reembolso de estacionamento',
  'Aquisição de material de escritório',
  'Compra de equipamentos de segurança',
  'Reembolso de almoço com cliente',
  'Solicitação de férias coletivas'
];

const statuses = ['pending', 'approved', 'rejected'];

async function generateApprovals() {
  try {
    console.log('\nGerando aprovações...');
    
    for (let i = 1; i <= 100; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const requester = requesters[Math.floor(Math.random() * requesters.length)];
      const approver = approvers[Math.floor(Math.random() * approvers.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Gerar valor baseado no tipo
      let amount = null;
      if (type !== 'vacation') {
        amount = Math.floor(Math.random() * 5000) + 100; // R$ 100 a R$ 5100
      }
      
      // Criar aprovação
      const approval = {
        id: uuidv4(),
        type,
        amount,
        requester,
        approver,
        description: `${description} - Aprovação #${i}`,
        status,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Últimos 30 dias
        updatedAt: new Date().toISOString()
      };
      
      // Se não for pending, adicionar dados de resposta
      if (status !== 'pending') {
        approval.responseAt = new Date().toISOString();
        approval.responseBy = approver;
        approval.action = status;
        approval.justification = status === 'approved' 
          ? 'Aprovado conforme política da empresa'
          : 'Rejeitado - não atende aos critérios estabelecidos';
      }
      
      // Salvar no banco
      databaseService.createApproval(approval);
      
      // Se não for pending, criar log de auditoria
      if (status !== 'pending') {
        await auditService.createAuditLog({
          approver: approver,
          action: status,
          timestamp: approval.responseAt,
          comment: approval.justification,
          approvalID: approval.id,
          isUpdate: false
        });
      }
      
      if (i % 10 === 0) {
        console.log(`Geradas ${i} aprovações...`);
      }
    }
    
    console.log('\n✅ 100 aprovações geradas com sucesso!');
    console.log('\nEstatísticas:');
    
    // Contar por status
    const pendingCount = databaseService.db.prepare('SELECT COUNT(*) as count FROM approvals WHERE status = "pending"').get().count;
    const approvedCount = databaseService.db.prepare('SELECT COUNT(*) as count FROM approvals WHERE status = "approved"').get().count;
    const rejectedCount = databaseService.db.prepare('SELECT COUNT(*) as count FROM approvals WHERE status = "rejected"').get().count;
    
    console.log(`  - Pendentes: ${pendingCount}`);
    console.log(`  - Aprovadas: ${approvedCount}`);
    console.log(`  - Rejeitadas: ${rejectedCount}`);
    
    // Contar por tipo
    const purchaseCount = databaseService.db.prepare('SELECT COUNT(*) as count FROM approvals WHERE type = "purchase"').get().count;
    const reimbursementCount = databaseService.db.prepare('SELECT COUNT(*) as count FROM approvals WHERE type = "reimbursement"').get().count;
    const vacationCount = databaseService.db.prepare('SELECT COUNT(*) as count FROM approvals WHERE type = "vacation"').get().count;
    
    console.log(`\nPor tipo:`);
    console.log(`  - Compras: ${purchaseCount}`);
    console.log(`  - Reembolsos: ${reimbursementCount}`);
    console.log(`  - Férias: ${vacationCount}`);
    
    console.log('\n🎯 Agora você pode testar:');
    console.log('1. Acesse http://localhost:3000');
    console.log('2. Login: admin@empresa.com / Admin123!');
    console.log('3. Veja as aprovações na tabela');
    console.log('4. Teste os botões de ação rápida');
    console.log('5. Acesse Logs de Auditoria');
    console.log('6. Teste os botões de alteração');
    
  } catch (error) {
    console.error('Erro ao gerar aprovações:', error);
  }
}

generateApprovals(); 