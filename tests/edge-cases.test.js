const request = require('supertest');
const app = require('../src/app');

describe('🔍 TESTES DE EDGE CASES E CENÁRIOS EXTREMOS', () => {
  let approvalIds = [];

  beforeEach(() => {
    // Limpar dados entre testes
    const approvalService = require('../src/services/approvalService');
    const auditService = require('../src/services/auditService');
    approvalService.clearData();
    auditService.clearData();
    approvalIds = [];
  });

  describe('📏 VALIDAÇÕES DE LIMITES', () => {
    describe('1.1 - Valores Extremos', () => {
      it('deve aceitar valor mínimo (0.01)', async () => {
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 0.01,
            requester: 'test@empresa.com',
            approver: 'admin@empresa.com'
          })
          .expect(201);

        approvalIds.push(createResponse.body.approvalID);
        expect(createResponse.body.status).toBe('pending');
      });

      it('deve aceitar valor alto mas válido', async () => {
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 999999.99,
            requester: 'test@empresa.com',
            approver: 'admin@empresa.com'
          })
          .expect(201);

        approvalIds.push(createResponse.body.approvalID);
        expect(createResponse.body.status).toBe('pending');
      });

      it('deve rejeitar valor zero', async () => {
        await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 0,
            requester: 'test@empresa.com',
            approver: 'admin@empresa.com'
          })
          .expect(400);
      });
    });

    describe('1.2 - Campos de Texto Extremos', () => {
      it('deve aceitar descrição muito longa', async () => {
        const longDescription = 'A'.repeat(500); // Máximo permitido
        
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: 'test@empresa.com',
            description: longDescription,
            approver: 'admin@empresa.com'
          })
          .expect(201);

        approvalIds.push(createResponse.body.approvalID);
      });

      it('deve rejeitar descrição muito longa', async () => {
        const tooLongDescription = 'A'.repeat(501); // Acima do limite
        
        await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: 'test@empresa.com',
            description: tooLongDescription,
            approver: 'admin@empresa.com'
          })
          .expect(400);
      });

      it('deve aceitar justificativa muito longa', async () => {
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

        const longJustification = 'Justificativa muito detalhada '.repeat(50);
        
        const respondResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@empresa.com',
            justification: longJustification
          })
          .expect(200);

        expect(respondResponse.body.status).toBe('approved');
      });
    });
  });

  describe('🔄 CENÁRIOS DE CONCORRÊNCIA EXTREMA', () => {
    describe('2.1 - Múltiplas Aprovações Simultâneas', () => {
      it('deve processar 10 aprovações simultaneamente', async () => {
        const promises = [];
        
        // Criar 10 aprovações simultaneamente
        for (let i = 0; i < 10; i++) {
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

        // Verificar que todas têm IDs únicos
        const ids = responses.map(r => r.body.approvalID);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(10);
      });
    });

    describe('2.2 - Respostas Simultâneas na Mesma Aprovação', () => {
      it('deve garantir atomicidade em respostas simultâneas', async () => {
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

        // Tentar 5 respostas simultâneas
        const promises = [];
        for (let i = 0; i < 5; i++) {
          promises.push(
            request(app)
              .post(`/api/approval/${approvalId}/respond`)
              .send({
                action: i % 2 === 0 ? 'approved' : 'rejected',
                approverID: 'admin@empresa.com',
                justification: `Tentativa ${i + 1}`
              })
          );
        }

        const responses = await Promise.all(promises);
        
        // Apenas uma deve ter sucesso
        const successCount = responses.filter(r => r.status === 200).length;
        const errorCount = responses.filter(r => r.status === 400).length;
        
        expect(successCount).toBe(1);
        expect(errorCount).toBe(4);
      });
    });
  });

  describe('🎭 CENÁRIOS DE USUÁRIOS ESPECIAIS', () => {
    describe('3.1 - Caracteres Especiais', () => {
      it('deve aceitar caracteres especiais em campos de texto', async () => {
        const specialChars = {
          requester: 'joão.silva@empresa.com',
          description: 'Compra com caracteres especiais: ç, ã, õ, é, à',
          approver: 'maria-santos@empresa.com'
        };

        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 100,
            requester: specialChars.requester,
            description: specialChars.description,
            approver: specialChars.approver
          })
          .expect(201);

        approvalIds.push(createResponse.body.approvalID);
      });

      it('deve aceitar emojis na justificativa', async () => {
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

        const emojiJustification = 'Aprovado! ✅ Projeto importante 🚀';
        
        const respondResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'admin@empresa.com',
            justification: emojiJustification
          })
          .expect(200);

        expect(respondResponse.body.status).toBe('approved');
      });
    });

    describe('3.2 - Emails Complexos', () => {
      it('deve aceitar emails com subdomínios e caracteres especiais', async () => {
        const complexEmails = [
          'user+tag@empresa.com',
          'user.name@subdomain.empresa.com',
          'user-name@empresa.com.br',
          'user123@empresa.co.uk'
        ];

        for (const email of complexEmails) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100,
              requester: email,
              approver: 'admin@empresa.com'
            })
            .expect(201);

          approvalIds.push(createResponse.body.approvalID);
        }
      });
    });
  });

  describe('📊 CENÁRIOS DE DADOS MASSIVOS', () => {
    describe('4.1 - Múltiplas Aprovações para Mesmo Aprovador', () => {
      it('deve listar corretamente muitas aprovações pendentes', async () => {
        const approver = 'gestor@empresa.com';
        
        // Criar 20 aprovações para o mesmo aprovador
        for (let i = 0; i < 20; i++) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100 * (i + 1),
              requester: `user${i}@empresa.com`,
              description: `Aprovação ${i + 1}`,
              approver: approver
            })
            .expect(201);

          approvalIds.push(createResponse.body.approvalID);
        }

        // Buscar pendentes
        const pendingResponse = await request(app)
          .get(`/api/approval/pending?approverID=${approver}`)
          .expect(200);

        expect(pendingResponse.body.approvals).toHaveLength(20);
        
        // Verificar que todas as aprovações têm dados válidos
        pendingResponse.body.approvals.forEach(approval => {
          expect(approval).toHaveProperty('id');
          expect(approval).toHaveProperty('type');
          expect(approval).toHaveProperty('amount');
          expect(approval).toHaveProperty('requester');
          expect(approval).toHaveProperty('createdAt');
        });
      });
    });

    describe('4.2 - Logs de Auditoria Massivos', () => {
      it('deve processar muitos logs de auditoria', async () => {
        // Criar e aprovar 50 aprovações
        for (let i = 0; i < 50; i++) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100,
              requester: `user${i}@empresa.com`,
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
              justification: `Aprovado ${i + 1}`
            })
            .expect(200);
        }

        // Verificar logs
        const auditResponse = await request(app)
          .get('/api/audit/logs')
          .expect(200);

        expect(auditResponse.body.logs).toHaveLength(50);
        
        // Verificar que todos são aprovados
        auditResponse.body.logs.forEach(log => {
          expect(log.action).toBe('approved');
        });
      });
    });
  });

  describe('🛡️ CENÁRIOS DE SEGURANÇA EXTREMA', () => {
    describe('5.1 - Payloads Maliciosos', () => {
      it('deve rejeitar SQL injection attempts', async () => {
        const maliciousPayloads = [
          { requester: "'; DROP TABLE approvals; --" },
          { description: "<script>alert('xss')</script>" },
          { description: "'; UPDATE users SET role='admin'; --" }
        ];

        for (const payload of maliciousPayloads) {
          await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100,
              requester: payload.requester || 'test@empresa.com',
              description: payload.description || 'Teste',
              approver: 'admin@empresa.com'
            })
            .expect(400);
        }
      });

      it('deve rejeitar XSS attempts', async () => {
        const xssPayloads = [
          "<script>alert('xss')</script>",
          "javascript:alert('xss')",
          "<img src=x onerror=alert('xss')>"
        ];

        for (const payload of xssPayloads) {
          await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100,
              requester: 'test@empresa.com',
              description: payload,
              approver: 'admin@empresa.com'
            })
            .expect(400);
        }
      });
    });

    describe('5.2 - Validação de Tipos Extremos', () => {
      it('deve rejeitar tipos de dados inválidos', async () => {
        const invalidPayloads = [
          { amount: "not a number" },
          { amount: null },
          { amount: undefined },
          { type: 123 },
          { requester: 456 },
          { approver: [] }
        ];

        for (const payload of invalidPayloads) {
          await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100,
              requester: 'test@empresa.com',
              approver: 'admin@empresa.com',
              ...payload
            })
            .expect(400);
        }
      });
    });
  });

  describe('⚡ CENÁRIOS DE PERFORMANCE EXTREMA', () => {
    describe('6.1 - Stress Test de Criação', () => {
      it('deve criar 100 aprovações rapidamente', async () => {
        const startTime = Date.now();
        
        const promises = [];
        for (let i = 0; i < 100; i++) {
          promises.push(
            request(app)
              .post('/api/approval/submit')
              .send({
                type: 'purchase',
                amount: 100,
                requester: `user${i}@empresa.com`,
                approver: 'admin@empresa.com'
              })
          );
        }

        const responses = await Promise.all(promises);
        const endTime = Date.now();
        
        // Verificar que todas foram criadas
        responses.forEach(response => {
          expect(response.status).toBe(201);
          approvalIds.push(response.body.approvalID);
        });

        // Verificar performance (deve ser rápido)
        const duration = endTime - startTime;
        expect(duration).toBeLessThan(10000); // Menos de 10 segundos
        
        console.log(`✅ 100 aprovações criadas em ${duration}ms`);
      });
    });

    describe('6.2 - Stress Test de Consulta', () => {
      it('deve consultar logs rapidamente', async () => {
        // Criar algumas aprovações primeiro
        for (let i = 0; i < 10; i++) {
          const createResponse = await request(app)
            .post('/api/approval/submit')
            .send({
              type: 'purchase',
              amount: 100,
              requester: `user${i}@empresa.com`,
              approver: 'admin@empresa.com'
            })
            .expect(201);

          const approvalId = createResponse.body.approvalID;
          approvalIds.push(approvalId);

          await request(app)
            .post(`/api/approval/${approvalId}/respond`)
            .send({
              action: 'approved',
              approverID: 'admin@empresa.com',
              justification: 'Teste performance'
            })
            .expect(200);
        }

        // Fazer 50 consultas simultâneas
        const startTime = Date.now();
        const promises = [];
        
        for (let i = 0; i < 50; i++) {
          promises.push(
            request(app)
              .get('/api/audit/logs')
              .expect(200)
          );
        }

        const responses = await Promise.all(promises);
        const endTime = Date.now();
        
        // Verificar que todas funcionaram
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        // Verificar performance
        const duration = endTime - startTime;
        expect(duration).toBeLessThan(5000); // Menos de 5 segundos
        
        console.log(`✅ 50 consultas executadas em ${duration}ms`);
      });
    });
  });

  describe('🎯 CENÁRIOS DE NEGÓCIO EXTREMOS', () => {
    describe('7.1 - Aprovação de Valor Extremamente Alto', () => {
      it('deve processar aprovação de valor muito alto', async () => {
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'purchase',
            amount: 999999999.99,
            requester: 'ceo@empresa.com',
            description: 'Aquisição de empresa - valor extremamente alto',
            approver: 'board@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'board@empresa.com',
            justification: 'Aprovado pelo conselho - aquisição estratégica'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('7.2 - Férias de Longa Duração', () => {
      it('deve processar férias de longa duração', async () => {
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'vacation',
            requester: 'funcionario@empresa.com',
            description: 'Férias de 30 dias - período sabático',
            approver: 'rh@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'rh@empresa.com',
            justification: 'Aprovado - período sabático conforme política da empresa'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });

    describe('7.3 - Reembolso de Viagem Internacional', () => {
      it('deve processar reembolso de viagem internacional', async () => {
        const createResponse = await request(app)
          .post('/api/approval/submit')
          .send({
            type: 'reimbursement',
            amount: 15000.00,
            requester: 'executivo@empresa.com',
            description: 'Reembolso viagem internacional - passagens, hotel, alimentação, transporte',
            approver: 'financeiro@empresa.com'
          })
          .expect(201);

        const approvalId = createResponse.body.approvalID;
        approvalIds.push(approvalId);

        // Aprovar
        const approveResponse = await request(app)
          .post(`/api/approval/${approvalId}/respond`)
          .send({
            action: 'approved',
            approverID: 'financeiro@empresa.com',
            justification: 'Aprovado - viagem internacional aprovada, documentação completa'
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
      });
    });
  });
}); 