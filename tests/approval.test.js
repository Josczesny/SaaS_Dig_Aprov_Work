const request = require('supertest');
const app = require('../src/app');
const approvalService = require('../src/services/approvalService');
const notificationService = require('../src/services/notificationService');

describe('Sistema de Aprovação', () => {
  beforeEach(() => {
    // Limpar dados de teste
    jest.clearAllMocks();
    
    // Limpar dados em memória dos serviços
    const approvalService = require('../src/services/approvalService');
    const auditService = require('../src/services/auditService');
    
    // Resetar dados em memória
    approvalService.clearData();
    auditService.clearData();
  });

  describe('POST /api/approval/submit', () => {
    it('deve criar uma aprovação válida', async () => {
      const payload = {
        type: 'purchase',
        amount: 100.50,
        requester: 'user123@empresa.com',
        description: 'Compra de material',
        approver: 'admin1@empresa.com'
      };

      const response = await request(app)
        .post('/api/approval/submit')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('approvalID');
      expect(response.body.status).toBe('pending');
      expect(response.body.message).toBe('Aprovação criada com sucesso');
    });

    it('deve rejeitar payload sem tipo', async () => {
      const payload = {
        amount: 100,
        requester: 'user123@empresa.com'
      };

      const response = await request(app)
        .post('/api/approval/submit')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Dados inválidos');
    });

    it('deve aceitar férias sem valor', async () => {
      const payload = {
        type: 'vacation',
        requester: 'user123@empresa.com',
        description: 'Férias anuais',
        approver: 'admin1@empresa.com'
      };

      const response = await request(app)
        .post('/api/approval/submit')
        .send(payload)
        .expect(201);

      expect(response.body.status).toBe('pending');
    });
  });

  describe('POST /api/approval/:id/respond', () => {
    let approvalId;

    beforeEach(async () => {
      // Criar uma aprovação para teste
      const approval = await approvalService.createApproval({
        type: 'purchase',
        amount: 100,
        requester: 'user123@empresa.com',
        approver: 'admin1@empresa.com'
      });
      approvalId = approval.id;
    });

    it('deve aprovar uma solicitação', async () => {
      const response = await request(app)
        .post(`/api/approval/${approvalId}/respond`)
        .send({
          action: 'approved',
          approverID: 'admin1@empresa.com',
          justification: 'Aprovado conforme política'
        })
        .expect(200);

      expect(response.body.status).toBe('approved');
      expect(response.body.message).toBe('Aprovação approved');
    });

    it('deve rejeitar uma solicitação', async () => {
      const response = await request(app)
        .post(`/api/approval/${approvalId}/respond`)
        .send({
          action: 'rejected',
          approverID: 'admin1@empresa.com',
          justification: 'Valor acima do limite'
        })
        .expect(200);

      expect(response.body.status).toBe('rejected');
    });

    it('deve rejeitar ação inválida', async () => {
      const response = await request(app)
        .post(`/api/approval/${approvalId}/respond`)
        .send({
          action: 'invalid',
          approverID: 'admin1@empresa.com'
        })
        .expect(400);

      expect(response.body.error).toBe('Dados inválidos');
    });
  });

  describe('GET /api/approval/pending', () => {
    beforeEach(async () => {
      // Criar aprovações pendentes
              await approvalService.createApproval({
          type: 'purchase',
          amount: 100,
          requester: 'user1@empresa.com',
          approver: 'admin1@empresa.com'
        });
        await approvalService.createApproval({
          type: 'reimbursement',
          amount: 50,
          requester: 'user2@empresa.com',
          approver: 'admin1@empresa.com'
        });
    });

    it('deve retornar aprovações pendentes do aprovador', async () => {
      const response = await request(app)
        .get('/api/approval/pending?approverID=admin1@empresa.com')
        .expect(200);

      expect(response.body.approvals).toHaveLength(2);
      expect(response.body.approvals[0]).toHaveProperty('id');
      expect(response.body.approvals[0]).toHaveProperty('type');
      expect(response.body.approvals[0]).toHaveProperty('requester');
    });
  });
});

describe('Serviço de Aprovação', () => {
  it('deve criar aprovação com dados válidos', async () => {
    const data = {
      type: 'purchase',
      amount: 100,
      requester: 'user123@empresa.com',
      approver: 'admin1@empresa.com'
    };

    const approval = await approvalService.createApproval(data);

    expect(approval).toHaveProperty('id');
    expect(approval.type).toBe('purchase');
    expect(approval.status).toBe('pending');
    expect(approval.requester).toBe('user123@empresa.com');
  });

  it('deve responder a uma aprovação', async () => {
    const approval = await approvalService.createApproval({
      type: 'purchase',
      amount: 100,
      requester: 'user123@empresa.com',
      approver: 'admin1@empresa.com'
    });

    const response = await approvalService.respondToApproval(approval.id, {
      action: 'approved',
      approverID: 'admin1@empresa.com',
      justification: 'Aprovado'
    });

    expect(response.status).toBe('approved');
    expect(response.response).toHaveProperty('approverID');
    expect(response.response).toHaveProperty('justification');
  });
}); 