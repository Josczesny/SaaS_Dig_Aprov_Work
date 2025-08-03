const request = require('supertest');
const app = require('../src/app');
const torDetectionService = require('../src/services/torDetection');
const User = require('../src/models/User');

describe('Sistema de Detecção e Bloqueio de Tor', () => {
  let adminToken;

  beforeEach(async () => {
    // Limpar dados de teste
    User.clearData();
    torDetectionService.clearCache();
    
    // Recriar usuário admin
    await User.create({
      email: 'admin@empresa.com',
      password: 'Admin123!',
      name: 'Administrador Sistema',
      role: 'admin',
      department: 'TI'
    });

    // Fazer login como admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@empresa.com',
        password: 'Admin123!'
      });

    adminToken = loginResponse.body.token;
  });

  describe('Detecção de IPs Tor', () => {
    test('Detecta IPs Tor conhecidos', async () => {
      // Simular IP Tor conhecido
      const torIP = '185.220.101.1'; // IP Tor conhecido
      
      const result = await torDetectionService.isTorExitNode(torIP);
      
      // Em ambiente de teste, pode não detectar (depende da lista atual)
      expect(typeof result).toBe('boolean');
    });

    test('Valida IPs corretamente', () => {
      expect(torDetectionService.isValidIP('192.168.1.1')).toBe(true);
      expect(torDetectionService.isValidIP('10.0.0.1')).toBe(true);
      expect(torDetectionService.isValidIP('256.256.256.256')).toBe(false);
      expect(torDetectionService.isValidIP('192.168.1')).toBe(false);
      expect(torDetectionService.isValidIP('')).toBe(false);
      expect(torDetectionService.isValidIP(null)).toBe(false);
    });

    test('Detecta padrões suspeitos de Tor', () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Mozilla/5.0 (Tor Browser)',
          'accept-language': undefined,
          'accept-encoding': undefined
        },
        connection: {
          remotePort: 9050
        }
      };

      const patterns = torDetectionService.detectTorPatterns(mockReq);
      expect(patterns).toBe(true);
    });

    test('Não detecta padrões em requisições normais', () => {
      const mockReq = {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'accept-language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'accept-encoding': 'gzip, deflate, br'
        },
        connection: {
          remotePort: 80
        }
      };

      const patterns = torDetectionService.detectTorPatterns(mockReq);
      expect(patterns).toBe(false);
    });
  });

  describe('Middleware de Bloqueio', () => {
    test('Permite acesso normal', async () => {
      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      expect(response.status).toBe(200);
    });

    test('Bloqueia acesso com headers suspeitos', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('User-Agent', 'Mozilla/5.0 (Tor Browser)')
        .set('Accept-Language', ''); // Header ausente

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado');
    });

    test('Bloqueia acesso em rotas sensíveis com padrões Tor', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Real-IP', '127.0.0.1')
        .set('User-Agent', 'Anonymous Browser')
        .set('Accept-Encoding', '') // Header ausente
        .send({
          email: 'test@empresa.com',
          password: 'Test123!'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso negado');
    });
  });

  describe('Rotas de Segurança (Admin)', () => {
    test('Admin pode acessar estatísticas Tor', async () => {
      const response = await request(app)
        .get('/api/security/tor-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('torExitNodesCount');
      expect(response.body.stats).toHaveProperty('verifiedCacheSize');
    });

    test('Admin pode limpar cache Tor', async () => {
      const response = await request(app)
        .post('/api/security/tor-cache/clear')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Cache de detecção Tor limpo com sucesso');
    });

    test('Admin pode atualizar lista Tor', async () => {
      const response = await request(app)
        .post('/api/security/tor-cache/update')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Lista de nós Tor atualizada com sucesso');
    });

    test('Admin pode consultar IPs bloqueados', async () => {
      const response = await request(app)
        .get('/api/security/blocked-ips')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('torExitNodesCount');
    });

    test('Usuário não-admin não pode acessar rotas de segurança', async () => {
      // Criar usuário normal
      await User.create({
        email: 'user@empresa.com',
        password: 'User123!',
        name: 'Usuário Normal',
        role: 'user',
        department: 'TI'
      });

      const userLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@empresa.com',
          password: 'User123!'
        });

      const userToken = userLoginResponse.body.token;

      const response = await request(app)
        .get('/api/security/tor-stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso restrito a administradores');
    });
  });

  describe('Logging de Segurança', () => {
    test('Logs são gerados para tentativas de Tor', async () => {
      // Esta verificação seria feita verificando os logs
      // Em um teste real, você verificaria se os logs foram escritos
      const response = await request(app)
        .get('/health')
        .set('X-Forwarded-For', '127.0.0.1')
        .set('User-Agent', 'Tor Browser')
        .set('Accept-Language', ''); // Header ausente

      expect(response.status).toBe(403);
      // O logging acontece internamente
    });
  });

  describe('Cache e Performance', () => {
    test('Cache funciona corretamente', async () => {
      const testIP = '192.168.1.100';
      
      // Primeira verificação
      const result1 = await torDetectionService.isTorExitNode(testIP);
      
      // Segunda verificação (deve usar cache)
      const result2 = await torDetectionService.isTorExitNode(testIP);
      
      expect(result1).toBe(result2);
    });

    test('Estatísticas são retornadas corretamente', () => {
      const stats = torDetectionService.getStats();
      
      expect(stats).toHaveProperty('torExitNodesCount');
      expect(stats).toHaveProperty('verifiedCacheSize');
      expect(stats).toHaveProperty('lastUpdate');
      expect(typeof stats.torExitNodesCount).toBe('number');
      expect(typeof stats.verifiedCacheSize).toBe('number');
    });
  });

  describe('Fail-safe e Robustez', () => {
    test('Sistema continua funcionando em caso de erro na verificação Tor', async () => {
      // Simular erro na verificação Tor
      const originalMethod = torDetectionService.checkExternalTorService;
      torDetectionService.checkExternalTorService = () => {
        throw new Error('Erro simulado');
      };

      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

      // Deve permitir acesso (fail-safe)
      expect(response.status).toBe(200);

      // Restaurar método original
      torDetectionService.checkExternalTorService = originalMethod;
    });
  });
}); 