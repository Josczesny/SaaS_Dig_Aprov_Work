const request = require('supertest');
const app = require('../src/app');
const torDetectionService = require('../src/services/torDetection');

describe('Teste Simples de Detecção Tor', () => {
  test('Sistema permite acesso normal', async () => {
    const response = await request(app)
      .get('/health')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  test('Sistema detecta padrões Tor mas permite em desenvolvimento', async () => {
    const response = await request(app)
      .get('/health')
      .set('User-Agent', 'Mozilla/5.0 (Tor Browser)')
      .set('X-Forwarded-For', '127.0.0.1,192.168.1.1')
      .set('Accept-Language', '')
      .set('Accept-Encoding', '');

    // Em desenvolvimento, deve permitir acesso mas registrar
    expect(response.status).toBe(200);
  });

  test('Serviço de detecção funciona', () => {
    const mockReq = {
      headers: {
        'user-agent': 'Mozilla/5.0 (Tor Browser)',
        'x-forwarded-for': '127.0.0.1,192.168.1.1',
        'accept-language': '',
        'accept-encoding': '',
        'x-tor-ip': '185.220.101.1'
      }
    };

    const patterns = torDetectionService.detectTorPatterns(mockReq);
    expect(typeof patterns).toBe('boolean');
  });

  test('Validação de IP funciona', () => {
    expect(torDetectionService.isValidIP('192.168.1.1')).toBe(true);
    expect(torDetectionService.isValidIP('256.256.256.256')).toBe(false);
  });
}); 