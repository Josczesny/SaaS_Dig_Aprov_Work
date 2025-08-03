// Configuração global para testes
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduzir logs durante testes

// Mock do console para evitar spam nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Timeout padrão para testes
jest.setTimeout(10000); 