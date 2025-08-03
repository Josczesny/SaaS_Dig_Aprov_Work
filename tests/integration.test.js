const request = require('supertest');
const app = require('../src/app');

describe('Integração - Sistema Completo', () => {
  let approvalId;

  describe('Fluxo Completo de Aprovação', () => {
    it('deve executar fluxo completo: criar → aprovar → auditar', async () => {
      // 1. Criar aprovação
      const createResponse = await request(app)
        .post('/api/approval/submit')
        .send({
          type: 'purchase',
          amount: 500.00,
          requester: 'joao.silva@empresa.com',
          description: 'Compra de equipamentos de escritório',
          approver: 'maria.santos@empresa.com'
        })
        .expect(201);

      approvalId = createResponse.body.approvalID;
      expect(createResponse.body.status).toBe('pending');

      // 2. Verificar aprovações pendentes
      const pendingResponse = await request(app)
        .get(`/api/approval/pending?approverID=maria.santos@empresa.com`)
        .expect(200);

      expect(pendingResponse.body.approvals).toHaveLength(1);
      expect(pendingResponse.body.approvals[0].id).toBe(approvalId);

      // 3. Aprovar solicitação
      const approveResponse = await request(app)
        .post(`/api/approval/${approvalId}/respond`)
        .send({
          action: 'approved',
          approverID: 'maria.santos@empresa.com',
          justification: 'Aprovado conforme política de compras'
        })
        .expect(200);

      expect(approveResponse.body.status).toBe('approved');

      // 4. Verificar logs de auditoria
      const auditResponse = await request(app)
        .get('/api/audit/logs')
        .expect(200);

      const approvalLogs = auditResponse.body.logs.filter(
        log => log.approvalID === approvalId
      );
      expect(approvalLogs).toHaveLength(1);
      expect(approvalLogs[0].action).toBe('approved');
    });

    it('deve rejeitar aprovação e registrar auditoria', async () => {
      // 1. Criar nova aprovação
      const createResponse = await request(app)
        .post('/api/approval/submit')
        .send({
          type: 'reimbursement',
          amount: 2000.00,
          requester: 'pedro.oliveira@empresa.com',
          description: 'Reembolso de viagem',
          approver: 'carlos.rodrigues@empresa.com'
        })
        .expect(201);

      const newApprovalId = createResponse.body.approvalID;

      // 2. Rejeitar aprovação
      const rejectResponse = await request(app)
        .post(`/api/approval/${newApprovalId}/respond`)
        .send({
          action: 'rejected',
          approverID: 'carlos.rodrigues@empresa.com',
          justification: 'Valor acima do limite permitido'
        })
        .expect(200);

      expect(rejectResponse.body.status).toBe('rejected');

      // 3. Verificar auditoria
      const auditResponse = await request(app)
        .get('/api/audit/logs')
        .expect(200);

      const rejectionLogs = auditResponse.body.logs.filter(
        log => log.approvalID === newApprovalId && log.action === 'rejected'
      );
      expect(rejectionLogs).toHaveLength(1);
    });
  });

  describe('Validações de Segurança', () => {
    it('deve rejeitar payloads inválidos', async () => {
      // Teste sem tipo
      await request(app)
        .post('/api/approval/submit')
        .send({
          amount: 100,
          requester: 'user@test.com'
        })
        .expect(400);

      // Teste com tipo inválido
      await request(app)
        .post('/api/approval/submit')
        .send({
          type: 'invalid_type',
          amount: 100,
          requester: 'user@test.com',
          approver: 'admin@test.com'
        })
        .expect(400);

      // Teste com valor negativo
      await request(app)
        .post('/api/approval/submit')
        .send({
          type: 'purchase',
          amount: -100,
          requester: 'user@test.com',
          approver: 'admin@test.com'
        })
        .expect(400);
    });

    it('deve rejeitar ações inválidas na resposta', async () => {
      // Criar aprovação primeiro
      const createResponse = await request(app)
        .post('/api/approval/submit')
        .send({
          type: 'purchase',
          amount: 100,
          requester: 'user@test.com',
          approver: 'admin@test.com'
        })
        .expect(201);

      const approvalId = createResponse.body.approvalID;

      // Tentar ação inválida
      await request(app)
        .post(`/api/approval/${approvalId}/respond`)
        .send({
          action: 'invalid_action',
          approverID: 'admin@test.com'
        })
        .expect(400);
    });
  });

  describe('Exportação de Auditoria', () => {
    it('deve exportar logs em CSV', async () => {
      const response = await request(app)
        .get('/api/audit/export?format=csv')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('deve rejeitar formato inválido', async () => {
      await request(app)
        .get('/api/audit/export?format=invalid')
        .expect(400);
    });
  });
}); 