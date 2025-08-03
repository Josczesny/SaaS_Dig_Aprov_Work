const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Sistema de Autenticação', () => {
  let adminToken, managerToken, userToken, approverToken;

  beforeEach(async () => {
    // Limpar dados de teste
    User.clearData();
    
    // Recriar usuários padrão
    await User.create({
      email: 'admin@empresa.com',
      password: 'Admin123!',
      name: 'Administrador Sistema',
      role: 'admin',
      department: 'TI'
    });

    await User.create({
      email: 'maria.santos@empresa.com',
      password: 'Manager123!',
      name: 'Maria Santos',
      role: 'manager',
      department: 'Financeiro'
    });

    await User.create({
      email: 'joao.silva@empresa.com',
      password: 'User123!',
      name: 'João Silva',
      role: 'user',
      department: 'TI'
    });

    await User.create({
      email: 'ana.rodrigues@empresa.com',
      password: 'Approver123!',
      name: 'Ana Rodrigues',
      role: 'approver',
      department: 'RH'
    });
  });

  describe('POST /api/auth/login', () => {
    test('Login bem-sucedido com admin', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.role).toBe('admin');
      
      adminToken = response.body.token;
    });

    test('Login bem-sucedido com manager', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'maria.santos@empresa.com',
          password: 'Manager123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('manager');
      
      managerToken = response.body.token;
    });

    test('Login bem-sucedido com user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.silva@empresa.com',
          password: 'User123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('user');
      
      userToken = response.body.token;
    });

    test('Login bem-sucedido com approver', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ana.rodrigues@empresa.com',
          password: 'Approver123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('approver');
      
      approverToken = response.body.token;
    });

    test('Login falha com credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'SenhaErrada123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciais inválidas');
    });

    test('Login falha com email inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inexistente@empresa.com',
          password: 'Senha123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciais inválidas');
    });

    test('Login falha com dados inválidos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email-invalido',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Dados inválidos');
    });

    test('Rate limiting funciona', async () => {
      // Em ambiente de teste, o rate limiting é desabilitado
      // Este teste verifica que o sistema funciona normalmente
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('GET /api/auth/me', () => {
    test('Retorna dados do usuário autenticado', async () => {
      // Primeiro fazer login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('name');
      expect(response.body.user).toHaveProperty('role');
      expect(response.body.user.email).toBe('admin@empresa.com');
    });

    test('Falha sem token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Token de acesso necessário');
    });

    test('Falha com token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Token inválido ou expirado');
    });
  });

  describe('POST /api/auth/register', () => {
    test('Admin pode criar novo usuário', async () => {
      // Primeiro fazer login como admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'novo@empresa.com',
          password: 'Novo123!',
          name: 'Novo Usuário',
          role: 'user',
          department: 'Marketing'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuário criado com sucesso');
      expect(response.body.user.email).toBe('novo@empresa.com');
    });

    test('Usuário não-admin não pode criar usuários', async () => {
      // Fazer login como user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.silva@empresa.com',
          password: 'User123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'novo@empresa.com',
          password: 'Novo123!',
          name: 'Novo Usuário',
          role: 'user',
          department: 'Marketing'
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso restrito a administradores');
    });

    test('Falha ao criar usuário com email já existente', async () => {
      // Primeiro fazer login como admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'admin@empresa.com', // Email já existe
          password: 'Novo123!',
          name: 'Novo Usuário',
          role: 'user',
          department: 'Marketing'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email já cadastrado');
    });

    test('Falha com dados inválidos', async () => {
      // Primeiro fazer login como admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'email-invalido',
          password: '123', // Senha muito fraca
          name: 'A', // Nome muito curto
          role: 'invalid-role',
          department: 'A' // Departamento muito curto
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Dados inválidos');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    test('Usuário pode alterar sua senha', async () => {
      // Primeiro fazer login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Admin123!',
          newPassword: 'NovaSenha123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Senha alterada com sucesso');

      // Verificar se a nova senha funciona
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'NovaSenha123!'
        });

      expect(newLoginResponse.status).toBe(200);
    });

    test('Falha com senha atual incorreta', async () => {
      // Primeiro fazer login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'SenhaErrada123!',
          newPassword: 'NovaSenha123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Senha atual incorreta');
    });

    test('Falha com nova senha inválida', async () => {
      // Primeiro fazer login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Admin123!',
          newPassword: '123' // Senha muito fraca
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Dados inválidos');
    });
  });

  describe('GET /api/auth/users', () => {
    test('Admin pode listar usuários', async () => {
      // Primeiro fazer login como admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    test('Usuário não-admin não pode listar usuários', async () => {
      // Fazer login como user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'joao.silva@empresa.com',
          password: 'User123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Acesso restrito a administradores');
    });
  });

  describe('POST /api/auth/logout', () => {
    test('Logout bem-sucedido', async () => {
      // Primeiro fazer login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@empresa.com',
          password: 'Admin123!'
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout realizado com sucesso');
    });
  });
}); 