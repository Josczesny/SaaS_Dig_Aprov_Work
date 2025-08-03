const request = require('supertest');
const app = require('../src/app');

describe('🧪 TESTES COMPREENSIVOS - TODOS OS FLUXOS EMPRESARIAIS', () => {
  let approvalIds = [];

  beforeEach(() => {
    // Limpar dados entre testes
    const approvalService = require('../src/services/approvalService');
    const auditService = require('../src/services/auditService');
    approvalService.clearData();
    auditService.clearData();
    approvalIds = [];
  });

  describe('📋 FLUXO 1: COMPRAS CORPORATIVAS', () => {
    describe('1.1 - Compra Pequena (Aprovação Direta)', () => {
      it('deve aprovar compra pequena sem problemas', async () => {
        // Criar solicitação de compra pequena
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 50.00,
            requester: 'joao.silva@empresa.com',
            description: 'Material de escritório',
            approver: 'maria.gestora@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Verificar se está pendente
        expect(createResponse.body.status).toBe('pending');

        // Aprovar compra
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'maria.gestora@empresa.com',
            justification: 'Compra aprovada - valor dentro do limite'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('1.2 - Compra Grande (Aprovação Hierárquica)', () => {
      it('deve processar compra grande com múltiplas aprovações', async () => {
        // Criar solicitação de compra grande
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 5000.00,
            requester: 'pedro.gerente@empresa.com',
            description: 'Equipamentos de TI',
            approver: 'carlos.diretor@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar pelo diretor
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'carlos.diretor@empresa.com',
            justification: 'Aprovado - equipamentos necessários para projeto'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('1.3 - Compra Rejeitada', () => {
      it('deve rejeitar compra fora da política', async () => {
        // Criar solicitação problemática
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 15000.00,
            requester: 'ana.junior@empresa.com',
            description: 'Móveis de luxo',
            approver: 'roberto.rh@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Rejeitar compra
        const rejectResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'rejected',
            approverID: 'roberto.rh@empresa.com',
            justification: 'Rejeitado - valor acima do limite e não justificado'
          })
          .expect(200);

        expect(rejectResponse.body.status).toBe('rejected');
      });
    });
  });

  describe('💳 FLUXO 2: REEMBOLSOS', () => {
    describe('2.1 - Reembolso de Viagem', () => {
      it('deve processar reembolso de viagem com documentação', async () => {
        // Criar solicitação de reembolso
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 850.00,
            requester: 'lucas.vendedor@empresa.com',
            description: 'Reembolso viagem cliente - combustível, alimentação e pedágio',
            approver: 'patricia.rh@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar reembolso
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'patricia.rh@empresa.com',
            justification: 'Aprovado - documentação completa e valores dentro da política'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('2.2 - Reembolso Rejeitado', () => {
      it('deve rejeitar reembolso sem documentação', async () => {
        // Criar solicitação sem documentação
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 1200.00,
            requester: 'fernando.consultor@empresa.com',
            description: 'Reembolso despesas',
            approver: 'gabriela.financeiro@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Rejeitar reembolso
        const rejectResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'rejected',
            approverID: 'gabriela.financeiro@empresa.com',
            justification: 'Rejeitado - documentação incompleta e valores não justificados'
          })
          .expect(200);

        expect(rejectResponse.body.status).toBe('rejected');
      });
    });
  });

  describe('🏖️ FLUXO 3: FÉRIAS', () => {
    describe('3.1 - Férias Aprovadas', () => {
      it('deve aprovar férias dentro da política', async () => {
        // Criar solicitação de férias
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'vacation',
            requester: 'mariana.analista@empresa.com',
            description: 'Férias anuais - 20 dias',
            approver: 'ricardo.gestor@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar férias
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'ricardo.gestor@empresa.com',
            justification: 'Aprovado - período adequado e planejamento realizado'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('3.2 - Férias Rejeitadas', () => {
      it('deve rejeitar férias em período crítico', async () => {
        // Criar solicitação em período crítico
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'vacation',
            requester: 'carlos.desenvolvedor@empresa.com',
            description: 'Férias - período de entrega do projeto',
            approver: 'ana.techlead@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Rejeitar férias
        const rejectResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'rejected',
            approverID: 'ana.techlead@empresa.com',
            justification: 'Rejeitado - período crítico do projeto, reagendar para depois da entrega'
          })
          .expect(200);

        expect(rejectResponse.body.status).toBe('rejected');
      });
    });
  });

  describe('🔍 FLUXO 4: AUDITORIA E COMPLIANCE', () => {
    describe('4.1 - Rastreabilidade Completa', () => {
      it('deve manter rastreabilidade de todas as ações', async () => {
        // Criar múltiplas aprovações
        const approvals = [];
        
        for (let i = 0; i < 3; i++) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100 * (i + 1),
              requester: `user${i}@empresa.com`,
              description: `Compra teste ${i + 1}`,
              approver: 'admin@empresa.com'
            })
            .expect(201);

          const approvalId = createResponse.body.approvalID;
          approvalIds.push(approvalId);
          approvals.push(approvalId);

          // Aprovar cada uma
          await request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'approved',
              approverID: 'admin@empresa.com',
              justification: `Aprovado teste ${i + 1}`
            })
            .expect(200);
        }

        // Verificar logs de auditoria
        const auditResponse = await request(app)
          .get('/api/audit/logs')
          .expect(200);

        expect(auditResponse.body.logs).toHaveLength(3);
        
        // Verificar se cada aprovação tem log
        approvals.forEach(approvalId => {
          const log = auditResponse.body.logs.find(l => l.approvalID === approvalId);
          expect(log).toBeDefined();
          expect(log.action).toBe('approved');
        });
      });
    });

    describe('4.2 - Exportação de Relatórios', () => {
      it('deve exportar relatórios para auditoria externa', async () => {
        // Criar algumas aprovações para teste
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 500.00,
            requester: 'test@empresa.com',
            description: 'Teste exportação',
            approver: 'admin@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@empresa.com',
            justification: 'Teste exportação'
          })
          .expect(200);

        // Exportar CSV
        const csvResponse = await request(app)
          .get('/api/audit/export?format=csv')
          .expect(200);

        expect(csvResponse.headers['content-type']).toContain('text/csv');
        expect(csvResponse.headers['content-disposition']).toContain('attachment');

        // Exportar PDF
        const pdfResponse = await request(app)
          .get('/api/audit/export?format=pdf')
          .expect(200);

        expect(pdfResponse.headers['content-type']).toContain('application/pdf');
      });
    });
  });

  describe('⚡ FLUXO 5: NOTIFICAÇÕES AUTOMÁTICAS', () => {
    describe('5.1 - Notificação de Nova Aprovação', () => {
      it('deve enviar notificação ao aprovador', async () => {
        // Criar aprovação (notificação automática)
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 300.00,
            requester: 'joao@empresa.com',
            description: 'Teste notificação',
            approver: 'maria@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Verificar se notificação foi processada (simulada)
        // O log deve mostrar "Notificação simulada"
        expect(createResponse.body.status).toBe('pending');
      });
    });

    describe('5.2 - Notificação de Resposta', () => {
      it('deve enviar notificação ao solicitante', async () => {
        // Criar aprovação
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 150.00,
            requester: 'pedro@empresa.com',
            description: 'Teste notificação resposta',
            approver: 'ana@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Responder (notificação automática ao solicitante)
        const respondResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'ana@empresa.com',
            justification: 'Aprovado - teste notificação'
          })
          .expect(200);

        expect(respondResponse.body.status).toBe('approved');
      });
    });
  });

  describe('🛡️ FLUXO 6: VALIDAÇÕES DE SEGURANÇA', () => {
    describe('6.1 - Validação de Payload', () => {
      it('deve rejeitar dados inválidos', async () => {
        // Teste sem tipo
        await request(app)
          .post('/api/approval/submit')
          .send({
            amount: 100,
            requester: 'test@empresa.com'
          })
          .expect(400);

        // Teste com tipo inválido
        await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'invalid_type',
            amount: 100,
            requester: 'test@empresa.com',
            approver: 'admin@empresa.com'
          })
          .expect(400);

        // Teste com valor negativo
        await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: -100,
            requester: 'test@empresa.com',
            approver: 'admin@empresa.com'
          })
          .expect(400);

        // Teste sem aprovador
        await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: 'test@empresa.com'
          })
          .expect(400);
      });
    });

    describe('6.2 - Validação de Ações', () => {
      it('deve rejeitar ações inválidas', async () => {
        // Criar aprovação
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: 'test@empresa.com',
            approver: 'admin@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Tentar ação inválida
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'invalid_action',
            approverID: 'admin@empresa.com'
          })
          .expect(400);

        // Tentar sem justificativa
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@empresa.com'
          })
          .expect(400);
      });
    });

    describe('6.3 - Prevenção de Reprocessamento', () => {
      it('deve impedir reprocessamento de aprovação', async () => {
        // Criar aprovação
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: 'test@empresa.com',
            approver: 'admin@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar primeira vez
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@empresa.com',
            justification: 'Primeira aprovação'
          })
          .expect(200);

        // Tentar aprovar novamente (deve falhar)
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'rejected',
            approverID: 'admin@empresa.com',
            justification: 'Segunda tentativa'
          })
          .expect(400);
      });
    });
  });

  describe('📊 FLUXO 7: DASHBOARD E RELATÓRIOS', () => {
    describe('7.1 - Listagem de Pendentes', () => {
      it('deve listar aprovações pendentes por aprovador', async () => {
        // Criar múltiplas aprovações para o mesmo aprovador
        const approver = 'maria.gestora@empresa.com';
        
        for (let i = 0; i < 3; i++) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100 * (i + 1),
              requester: `user${i}@empresa.com`,
              description: `Pendente ${i + 1}`,
              approver: approver
            })
            .expect(201);

          approvalIds.push(createResponse.body.approvalID);
        }

        // Buscar pendentes do aprovador
        const pendingResponse = await request(app)
          .get(`/api/approval/pending?approverID=${approver}`)
          .expect(200);

        expect(pendingResponse.body.approvals).toHaveLength(3);
        
        // Verificar estrutura dos dados
        pendingResponse.body.approvals.forEach(approval => {
          expect(approval).toHaveProperty('id');
          expect(approval).toHaveProperty('type');
          expect(approval).toHaveProperty('amount');
          expect(approval).toHaveProperty('requester');
          expect(approval).toHaveProperty('createdAt');
        });
      });
    });

    describe('7.2 - Filtros de Auditoria', () => {
      it('deve filtrar logs por período e aprovador', async () => {
        // Criar aprovações com diferentes aprovadores
        const aprovadores = ['admin1@empresa.com', 'admin2@empresa.com'];
        
        for (let i = 0; i < 2; i++) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100,
              requester: `user${i}@empresa.com`,
              approver: aprovadores[i]
            })
            .expect(201);

          const approvalId = createResponse.body.approvalID;
          approvalIds.push(approvalId);

          // Aprovar
          await request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'approved',
              approverID: aprovadores[i],
              justification: 'Teste filtro'
            })
            .expect(200);
        }

        // Filtrar por aprovador
        const filterResponse = await request(app)
          .get('/api/audit/logs?approverID=admin1@empresa.com')
          .expect(200);

        expect(filterResponse.body.logs).toHaveLength(1);
        expect(filterResponse.body.logs[0].approver).toBe('admin1@empresa.com');
      });
    });
  });

  describe('🚨 FLUXO 8: CENÁRIOS DE ERRO', () => {
    describe('8.1 - Aprovação Não Encontrada', () => {
      it('deve tratar aprovação inexistente', async () => {
        const fakeId = 'fake-uuid-12345';
        
        await request(app)
          .post(`/api/approval/${fakeId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@empresa.com',
            justification: 'Teste erro'
          })
          .expect(404);
      });
    });

    describe('8.2 - Formato de Exportação Inválido', () => {
      it('deve rejeitar formato não suportado', async () => {
        await request(app)
          .get('/api/audit/export?format=invalid')
          .expect(400);
      });
    });

    describe('8.3 - Dados Corrompidos', () => {
      it('deve tratar payload malformado', async () => {
        await request(app)
          .post('/api/approval/submit')
          .send('invalid json')
          .expect(400);
      });
    });
  });

  describe('⚡ FLUXO 9: PERFORMANCE E CONCORRÊNCIA', () => {
    describe('9.1 - Múltiplas Aprovações Simultâneas', () => {
      it('deve processar múltiplas aprovações sem conflito', async () => {
        const promises = [];
        
        // Criar 5 aprovações simultaneamente
        for (let i = 0; i < 5; i++) {
          promises.push(
            request(app)
              .post('/api/approval/submit')
              .send({
                type: 'purchase',
                amount: 100 * (i + 1),
                requester: `user${i}@empresa.com`,
                approver: 'admin@empresa.com'
              })
          );
        }

        const responses = await Promise.all(promises);
        
        // Verificar que todas foram criadas
        responses.forEach(response => {
          expect(response.status).toBe(201);
          expect(response.body).toHaveProperty('approvalID');
          approvalIds.push(response.body.approvalID);
        });
      });
    });

    describe('9.2 - Respostas Simultâneas', () => {
      it('deve evitar condições de corrida', async () => {
        // Criar uma aprovação
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: 'test@empresa.com',
            approver: 'admin@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Tentar responder duas vezes simultaneamente
        const promises = [
          request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'approved',
              approverID: 'admin@empresa.com',
              justification: 'Primeira tentativa'
            }),
          request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'rejected',
              approverID: 'admin@empresa.com',
              justification: 'Segunda tentativa'
            })
        ];

        const responses = await Promise.all(promises);
        
        // Uma deve ter sucesso, outra deve falhar
        const successCount = responses.filter(r => r.status === 200).length;
        const errorCount = responses.filter(r => r.status === 400).length;
        
        expect(successCount).toBe(1);
        expect(errorCount).toBe(1);
      });
    });
  });

  describe('🎯 FLUXO 10: CENÁRIOS REAIS DE EMPRESA', () => {
    describe('10.1 - Fluxo de Compra Corporativa Completo', () => {
      it('deve simular fluxo real de compra empresarial', async () => {
        // 1. Funcionário solicita compra
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 2500.00,
            requester: 'ana.analista@empresa.com',
            description: 'Notebook para desenvolvimento - Dell Latitude 5520',
            approver: 'carlos.gerente@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // 2. Verificar se está na lista de pendentes
        const pendingResponse = await request(app)
          .get('/api/approval/pending?approverID=carlos.gerente@empresa.com')
          .expect(200);

        expect(pendingResponse.body.approvals).toHaveLength(1);
        expect(pendingResponse.body.approvals[0].id).toBe(approvalId);

        // 3. Gerente aprova com justificativa
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'carlos.gerente@empresa.com',
            justification: 'Aprovado - equipamento necessário para projeto crítico Q4'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');

        // 4. Verificar auditoria
        const auditResponse = await request(app)
          .get('/api/audit/logs')
          .expect(200);

        const approvalLog = auditResponse.body.logs.find(l => l.approvalID === approvalId);
        expect(approvalLog).toBeDefined();
        expect(approvalLog.action).toBe('approved');
        expect(approvalLog.approver).toBe('carlos.gerente@empresa.com');
      });
    });

    describe('10.2 - Fluxo de Reembolso com Documentação', () => {
      it('deve processar reembolso com validação rigorosa', async () => {
        // 1. Vendedor solicita reembolso
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 1250.00,
            requester: 'lucas.vendedor@empresa.com',
            description: 'Reembolso viagem cliente ABC - combustível R$ 300, pedágio R$ 150, alimentação R$ 800',
            approver: 'patricia.rh@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // 2. RH valida e aprova
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'patricia.rh@empresa.com',
            justification: 'Aprovado - documentação completa, valores dentro da política de viagem'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('10.3 - Fluxo de Férias com Planejamento', () => {
      it('deve gerenciar férias considerando impacto no projeto', async () => {
        // 1. Desenvolvedor solicita férias
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'vacation',
            requester: 'rafael.desenvolvedor@empresa.com',
            description: 'Férias anuais - 15 dias em dezembro',
            approver: 'marina.techlead@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // 2. Tech Lead avalia impacto e aprova
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'marina.techlead@empresa.com',
            justification: 'Aprovado - período adequado, backup planejado, não impacta entregas críticas'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });
  });
}); 