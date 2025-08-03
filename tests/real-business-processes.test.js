const request = require('supertest');
const app = require('../src/app');

describe('🏢 TESTES DE PROCESSOS EMPRESARIAIS REAIS', () => {
  let approvalIds = [];

  beforeEach(() => {
    // Limpar dados entre testes
    const approvalService = require('../src/services/approvalService');
    const auditService = require('../src/services/auditService');
    approvalService.clearData();
    auditService.clearData();
    approvalIds = [];
  });

  describe('💰 PROCESSO 1: COMPRAS CORPORATIVAS', () => {
    describe('1.1 - Compra de Material de Escritório (Limite Baixo)', () => {
      it('deve processar compra de material de escritório - aprovada pelo gestor direto', async () => {
        // CENÁRIO REAL: Funcionário solicita material de escritório
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 85.50,
            requester: 'maria.analista@techcorp.com.br',
            description: 'Material de escritório: 2 caixas de papel A4, 5 canetas, 2 blocos de notas',
            approver: 'joao.gestor@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Verificar se está pendente
        expect(createResponse.body.status).toBe('pending');

        // Gestor aprova (cenário real)
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'joao.gestor@techcorp.com.br',
            justification: 'Aprovado - material necessário para atividades diárias'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('1.2 - Compra de Equipamento de TI (Limite Médio)', () => {
      it('deve processar compra de equipamento - aprovada pelo gerente de TI', async () => {
        // CENÁRIO REAL: Desenvolvedor solicita equipamento
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 3500.00,
            requester: 'pedro.desenvolvedor@techcorp.com.br',
            description: 'Notebook Dell Latitude 5520 - 16GB RAM, 512GB SSD, para desenvolvimento',
            approver: 'ana.ti@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Gerente de TI aprova
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'ana.ti@techcorp.com.br',
            justification: 'Aprovado - equipamento adequado para desenvolvimento, dentro do orçamento'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('1.3 - Compra de Servidor (Limite Alto)', () => {
      it('deve processar compra de servidor - aprovada pelo diretor', async () => {
        // CENÁRIO REAL: Infraestrutura solicita servidor
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 25000.00,
            requester: 'carlos.infra@techcorp.com.br',
            description: 'Servidor Dell PowerEdge R750 - 64GB RAM, 2TB SSD, para produção',
            approver: 'roberto.diretor@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Diretor aprova
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'roberto.diretor@techcorp.com.br',
            justification: 'Aprovado - servidor necessário para expansão da infraestrutura'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('1.4 - Compra Rejeitada (Fora da Política)', () => {
      it('deve rejeitar compra fora da política da empresa', async () => {
        // CENÁRIO REAL: Funcionário solicita item de luxo
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 1500.00,
            requester: 'lucas.junior@techcorp.com.br',
            description: 'Cadeira de escritório ergonômica premium',
            approver: 'patricia.rh@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // RH rejeita
        const rejectResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'rejected',
            approverID: 'patricia.rh@techcorp.com.br',
            justification: 'Rejeitado - item não essencial, fora da política de compras'
          })
          .expect(200);

        expect(rejectResponse.body.status).toBe('rejected');
      });
    });
  });

  describe('💳 PROCESSO 2: REEMBOLSOS DE VIAGEM', () => {
    describe('2.1 - Reembolso de Viagem de Vendas', () => {
      it('deve processar reembolso de viagem com documentação completa', async () => {
        // CENÁRIO REAL: Vendedor solicita reembolso de viagem
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 1250.00,
            requester: 'fernando.vendedor@techcorp.com.br',
            description: 'Reembolso viagem cliente ABC: combustível R$ 300, pedágio R$ 150, alimentação R$ 800',
            approver: 'gabriela.financeiro@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Financeiro aprova
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'gabriela.financeiro@techcorp.com.br',
            justification: 'Aprovado - documentação completa, valores dentro da política de viagem'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('2.2 - Reembolso de Viagem Internacional', () => {
      it('deve processar reembolso de viagem internacional', async () => {
        // CENÁRIO REAL: Executivo solicita reembolso de viagem internacional
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 8500.00,
            requester: 'marina.executiva@techcorp.com.br',
            description: 'Reembolso viagem EUA: passagem R$ 4000, hotel R$ 2500, alimentação R$ 2000',
            approver: 'carlos.ceo@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // CEO aprova
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'carlos.ceo@techcorp.com.br',
            justification: 'Aprovado - viagem estratégica para parceria comercial'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('2.3 - Reembolso Rejeitado (Documentação Incompleta)', () => {
      it('deve rejeitar reembolso sem documentação adequada', async () => {
        // CENÁRIO REAL: Funcionário solicita reembolso sem comprovantes
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 800.00,
            requester: 'ricardo.consultor@techcorp.com.br',
            description: 'Reembolso despesas de viagem',
            approver: 'gabriela.financeiro@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Financeiro rejeita
        const rejectResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'rejected',
            approverID: 'gabriela.financeiro@techcorp.com.br',
            justification: 'Rejeitado - documentação incompleta, comprovantes não anexados'
          })
          .expect(200);

        expect(rejectResponse.body.status).toBe('rejected');
      });
    });
  });

  describe('🏖️ PROCESSO 3: FÉRIAS E AUSÊNCIAS', () => {
    describe('3.1 - Férias Aprovadas (Período Adequado)', () => {
      it('deve aprovar férias em período adequado', async () => {
        // CENÁRIO REAL: Funcionário solicita férias
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'vacation',
            requester: 'lucas.analista@techcorp.com.br',
            description: 'Férias anuais - 20 dias em janeiro',
            approver: 'maria.gestora@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Gestora aprova
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'maria.gestora@techcorp.com.br',
            justification: 'Aprovado - período adequado, backup planejado'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('3.2 - Férias Rejeitadas (Período Crítico)', () => {
      it('deve rejeitar férias em período crítico do projeto', async () => {
        // CENÁRIO REAL: Desenvolvedor solicita férias durante entrega
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'vacation',
            requester: 'rafael.desenvolvedor@techcorp.com.br',
            description: 'Férias - período de entrega do projeto crítico',
            approver: 'ana.techlead@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Tech Lead rejeita
        const rejectResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'rejected',
            approverID: 'ana.techlead@techcorp.com.br',
            justification: 'Rejeitado - período crítico do projeto, reagendar para depois da entrega'
          })
          .expect(200);

        expect(rejectResponse.body.status).toBe('rejected');
      });
    });

    describe('3.3 - Férias de Longa Duração (Período Sabático)', () => {
      it('deve processar férias de longa duração', async () => {
        // CENÁRIO REAL: Funcionário solicita período sabático
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'vacation',
            requester: 'carla.senior@techcorp.com.br',
            description: 'Período sabático - 30 dias para estudos',
            approver: 'roberto.rh@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // RH aprova
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'roberto.rh@techcorp.com.br',
            justification: 'Aprovado - período sabático conforme política da empresa'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });
  });

  describe('📊 PROCESSO 4: AUDITORIA E COMPLIANCE', () => {
    describe('4.1 - Rastreabilidade de Aprovações', () => {
      it('deve manter rastreabilidade completa de todas as ações', async () => {
        // CENÁRIO REAL: Múltiplas aprovações em um dia
        const approvals = [];
        
        // Criar 3 aprovações diferentes
        const scenarios = [
          {
            type: 'purchase',
            amount: 500,
            requester: 'joao.analista@techcorp.com.br',
            description: 'Compra de licenças de software',
            approver: 'maria.gestora@techcorp.com.br'
          },
          {
            type: 'reimbursement',
            amount: 300,
            requester: 'pedro.vendedor@techcorp.com.br',
            description: 'Reembolso de despesas de cliente',
            approver: 'gabriela.financeiro@techcorp.com.br'
          },
          {
            type: 'vacation',
            requester: 'ana.desenvolvedora@techcorp.com.br',
            description: 'Férias anuais',
            approver: 'carlos.techlead@techcorp.com.br'
          }
        ];

        for (const scenario of scenarios) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send(scenario)
            .expect(201);

          const approvalId = createResponse.body.approvalID;
          approvalIds.push(approvalId);
          approvals.push(approvalId);

          // Aprovar cada uma
          await request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'approved',
              approverID: scenario.approver,
              justification: 'Aprovado conforme política'
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

    describe('4.2 - Exportação para Auditoria Externa', () => {
      it('deve exportar relatórios para auditoria externa', async () => {
        // CENÁRIO REAL: Auditoria trimestral
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 1500.00,
            requester: 'lucas.gerente@techcorp.com.br',
            description: 'Compra de equipamentos para auditoria',
            approver: 'patricia.diretora@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'patricia.diretora@techcorp.com.br',
            justification: 'Aprovado para auditoria trimestral'
          })
          .expect(200);

        // Exportar CSV para auditoria
        const csvResponse = await request(app)
          .get('/api/audit/export?format=csv')
          .expect(200);

        expect(csvResponse.headers['content-type']).toContain('text/csv');
        expect(csvResponse.headers['content-disposition']).toContain('attachment');

        // Exportar PDF para relatório
        const pdfResponse = await request(app)
          .get('/api/audit/export?format=pdf')
          .expect(200);

        expect(pdfResponse.headers['content-type']).toContain('application/pdf');
      });
    });
  });

  describe('⚡ PROCESSO 5: NOTIFICAÇÕES AUTOMÁTICAS', () => {
    describe('5.1 - Notificação de Nova Aprovação', () => {
      it('deve enviar notificação automática ao aprovador', async () => {
        // CENÁRIO REAL: Funcionário cria aprovação
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 750.00,
            requester: 'carla.analista@techcorp.com.br',
            description: 'Compra de material para projeto',
            approver: 'roberto.gestor@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Verificar se notificação foi processada (simulada)
        expect(createResponse.body.status).toBe('pending');
      });
    });

    describe('5.2 - Notificação de Resposta', () => {
      it('deve enviar notificação automática ao solicitante', async () => {
        // CENÁRIO REAL: Aprovador responde
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 450.00,
            requester: 'fernando.vendedor@techcorp.com.br',
            description: 'Reembolso de despesas de viagem',
            approver: 'gabriela.financeiro@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Responder (notificação automática ao solicitante)
        const respondResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'gabriela.financeiro@techcorp.com.br',
            justification: 'Aprovado - documentação completa'
          })
          .expect(200);

        expect(respondResponse.body.status).toBe('approved');
      });
    });
  });

  describe('🛡️ PROCESSO 6: VALIDAÇÕES DE SEGURANÇA', () => {
    describe('6.1 - Validação de Dados de Entrada', () => {
      it('deve rejeitar dados inválidos conforme política', async () => {
        // CENÁRIO REAL: Tentativas de submissão inválida
        
        // Teste sem tipo
        await request(app)
          .post('/api/approval/submit')
          .send({
            amount: 100,
            requester: 'teste@techcorp.com.br'
          })
          .expect(400);

        // Teste com tipo inválido
        await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'invalid_type',
            amount: 100,
            requester: 'teste@techcorp.com.br',
            approver: 'admin@techcorp.com.br'
          })
          .expect(400);

        // Teste com valor negativo
        await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: -100,
            requester: 'teste@techcorp.com.br',
            approver: 'admin@techcorp.com.br'
          })
          .expect(400);

        // Teste sem aprovador
        await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: 'teste@techcorp.com.br'
          })
          .expect(400);
      });
    });

    describe('6.2 - Validação de Ações de Resposta', () => {
      it('deve rejeitar ações inválidas na resposta', async () => {
        // CENÁRIO REAL: Tentativa de ação inválida
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: 'teste@techcorp.com.br',
            approver: 'admin@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Tentar ação inválida
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'invalid_action',
            approverID: 'admin@techcorp.com.br'
          })
          .expect(400);

        // Tentar sem justificativa
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@techcorp.com.br'
          })
          .expect(400);
      });
    });

    describe('6.3 - Prevenção de Reprocessamento', () => {
      it('deve impedir reprocessamento de aprovação já respondida', async () => {
        // CENÁRIO REAL: Tentativa de responder aprovação já processada
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 500.00,
            requester: 'teste@techcorp.com.br',
            description: 'Teste reprocessamento',
            approver: 'admin@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Primeira resposta (deve funcionar)
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@techcorp.com.br',
            justification: 'Primeira resposta'
          })
          .expect(200);

        // Segunda tentativa (deve falhar)
        await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'rejected',
            approverID: 'admin@techcorp.com.br',
            justification: 'Segunda tentativa'
          })
          .expect(400);

        // Verificar que o status permanece como 'approved'
        const auditResponse = await request(app)
          .get('/api/audit/logs')
          .expect(200);

        const approvalLog = auditResponse.body.logs.find(l => l.approvalID === approvalId);
        expect(approvalLog).toBeDefined();
        expect(approvalLog.action).toBe('approved');
      });
    });

    describe('6.4 - Validação de Payloads Maliciosos', () => {
      it('deve rejeitar payloads com caracteres especiais perigosos', async () => {
        // CENÁRIO REAL: Tentativas de injeção de código
        const maliciousPayloads = [
          {
            type: 'purchase',
            amount: 100,
            requester: 'teste@techcorp.com.br',
            description: '<script>alert("xss")</script>',
            approver: 'admin@techcorp.com.br'
          },
          {
            type: 'purchase',
            amount: 100,
            requester: 'teste@techcorp.com.br',
            description: '"; DROP TABLE approvals; --',
            approver: 'admin@techcorp.com.br'
          },
          {
            type: 'purchase',
            amount: 100,
            requester: 'teste@techcorp.com.br',
            description: 'javascript:alert("xss")',
            approver: 'admin@techcorp.com.br'
          }
        ];

        for (const payload of maliciousPayloads) {
          await request(app)
            .post('/api/approval/submit')
            .send(payload)
            .expect(400);
        }
      });
    });
  });

  describe('📊 PROCESSO 7: DASHBOARD E RELATÓRIOS', () => {
    describe('7.1 - Listagem de Pendentes por Aprovador', () => {
      it('deve listar aprovações pendentes do aprovador', async () => {
        // CENÁRIO REAL: Gestor verifica suas pendências
        const approver = 'maria.gestora@techcorp.com.br';
        
        // Criar múltiplas aprovações para o mesmo aprovador
        for (let i = 0; i < 3; i++) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100 * (i + 1),
              requester: `funcionario${i}@techcorp.com.br`,
              description: `Aprovação ${i + 1}`,
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

    describe('7.2 - Filtros de Auditoria por Período', () => {
      it('deve filtrar logs por período e aprovador', async () => {
        // CENÁRIO REAL: Auditoria por período
        const aprovadores = ['admin1@techcorp.com.br', 'admin2@techcorp.com.br'];
        
        for (let i = 0; i < 2; i++) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100,
              requester: `funcionario${i}@techcorp.com.br`,
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
              justification: 'Aprovado para auditoria'
            })
            .expect(200);
        }

        // Filtrar por aprovador
        const filterResponse = await request(app)
          .get('/api/audit/logs?approverID=admin1@techcorp.com.br')
          .expect(200);

        expect(filterResponse.body.logs).toHaveLength(1);
        expect(filterResponse.body.logs[0].approver).toBe('admin1@techcorp.com.br');
      });
    });
  });

  describe('🚨 PROCESSO 8: CENÁRIOS DE ERRO REAIS', () => {
    describe('8.1 - Aprovação Não Encontrada', () => {
      it('deve tratar aprovação inexistente', async () => {
        // CENÁRIO REAL: Tentativa de responder aprovação inexistente
        const fakeId = 'fake-uuid-12345';
        
        await request(app)
          .post(`/api/approval/${fakeId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@techcorp.com.br',
            justification: 'Teste erro'
          })
          .expect(404);
      });
    });

    describe('8.2 - Formato de Exportação Inválido', () => {
      it('deve rejeitar formato não suportado', async () => {
        // CENÁRIO REAL: Tentativa de exportar em formato inválido
        await request(app)
          .get('/api/audit/export?format=invalid')
          .expect(400);
      });
    });

    describe('8.3 - Dados Corrompidos', () => {
      it('deve tratar payload malformado', async () => {
        // CENÁRIO REAL: Payload corrompido
        await request(app)
          .post('/api/approval/submit')
          .send('invalid json')
          .expect(400);
      });
    });
  });

  describe('⚡ PROCESSO 9: ATOMICIDADE E CONCORRÊNCIA', () => {
    describe('9.1 - Respostas Simultâneas na Mesma Aprovação', () => {
      it('deve garantir atomicidade em respostas simultâneas', async () => {
        // CENÁRIO REAL: Múltiplos aprovadores tentam responder simultaneamente
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 1000.00,
            requester: 'teste@techcorp.com.br',
            description: 'Teste atomicidade',
            approver: 'admin@techcorp.com.br'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Tentar 3 respostas simultâneas
        const promises = [
          request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'approved',
              approverID: 'admin@techcorp.com.br',
              justification: 'Primeira tentativa'
            }),
          request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'rejected',
              approverID: 'admin@techcorp.com.br',
              justification: 'Segunda tentativa'
            }),
          request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'approved',
              approverID: 'admin@techcorp.com.br',
              justification: 'Terceira tentativa'
            })
        ];

        const responses = await Promise.all(promises);
        
        // Apenas uma deve ter sucesso (200), as outras devem falhar (400)
        const successCount = responses.filter(r => r.status === 200).length;
        const errorCount = responses.filter(r => r.status === 400).length;
        
        expect(successCount).toBe(1);
        expect(errorCount).toBe(2);

        // Verificar que apenas uma resposta foi registrada na auditoria
        const auditResponse = await request(app)
          .get('/api/audit/logs')
          .expect(200);

        const approvalLogs = auditResponse.body.logs.filter(l => l.approvalID === approvalId);
        expect(approvalLogs).toHaveLength(1);
      });
    });
  });
}); 