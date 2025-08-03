const express = require('express');
const Joi = require('joi');
const { logger } = require('../utils/logger');
const User = require('../models/User');
const { 
  generateToken, 
  loginLimiter, 
  authenticateToken,
  authorizeAdmin,
  securityLogger 
} = require('../middleware/auth');

const router = express.Router();

// Schema de validação para login
const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .pattern(/^[^';]*$/).message('Email não pode conter caracteres especiais'),
  password: Joi.string().min(6).required()
    .pattern(/^[^<>]*$/).message('Senha não pode conter tags HTML')
});

// Schema de validação para registro (apenas admin)
const registerSchema = Joi.object({
  email: Joi.string().email().required()
    .pattern(/^[^';]*$/).message('Email não pode conter caracteres especiais'),
  password: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial'),
  name: Joi.string().min(2).max(100).required()
    .pattern(/^[^<>]*$/).message('Nome não pode conter tags HTML'),
  role: Joi.string().valid('user', 'approver', 'manager', 'admin', 'auditor').required(),
  department: Joi.string().min(2).max(50).required()
    .pattern(/^[^<>]*$/).message('Departamento não pode conter tags HTML')
});

// Schema de validação para alteração de senha
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .message('Nova senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial')
});

// POST /api/auth/login
router.post('/login', loginLimiter, securityLogger, async (req, res) => {
  try {
    // Validação do payload
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      logger.warn('Tentativa de login com dados inválidos', {
        email: req.body.email,
        error: error.details[0].message,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    const { email, password } = value;

    // Buscar usuário
    const user = User.findByEmail(email);
    if (!user) {
      logger.warn('Tentativa de login com email inexistente', {
        email,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se usuário está ativo
    if (!user.isActive) {
      logger.warn('Tentativa de login com usuário inativo', {
        email,
        userId: user.id,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    // Verificar se usuário está bloqueado
    if (user.isLocked()) {
      logger.warn('Tentativa de login com usuário bloqueado', {
        email,
        userId: user.id,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      return res.status(423).json({ 
        error: 'Conta bloqueada. Tente novamente em 15 minutos.' 
      });
    }

    // Validar senha
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      user.recordFailedLogin();
      User.update(user.id, user);
      
      logger.warn('Tentativa de login com senha incorreta', {
        email,
        userId: user.id,
        failedAttempts: user.failedLoginAttempts,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Login bem-sucedido
    user.recordSuccessfulLogin();
    User.update(user.id, user);

    // Gerar token
    const token = generateToken(user);

    logger.info('Login bem-sucedido', {
      email,
      userId: user.id,
      role: user.role,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });

  } catch (error) {
    logger.error('Erro no login', {
      error: error.message,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, securityLogger, (req, res) => {
  try {
    logger.info('Logout realizado', {
      userId: req.user.id,
      email: req.user.email,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Em um sistema real, você poderia invalidar o token
    // Por enquanto, apenas retornamos sucesso
    res.json({ message: 'Logout realizado com sucesso' });

  } catch (error) {
    logger.error('Erro no logout', {
      error: error.message,
      userId: req.user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, securityLogger, (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        department: req.user.department,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar dados do usuário', {
      error: error.message,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register (apenas admin)
router.post('/register', authenticateToken, authorizeAdmin, securityLogger, async (req, res) => {
  try {
    // Validação do payload
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      logger.warn('Tentativa de registro com dados inválidos', {
        adminId: req.user.id,
        error: error.details[0].message,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    const { email, password, name, role, department } = value;

    // Verificar se email já existe
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      logger.warn('Tentativa de registro com email já existente', {
        email,
        adminId: req.user.id,
        timestamp: new Date().toISOString()
      });
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário
    const newUser = await User.create({
      email,
      password,
      name,
      role,
      department
    });

    logger.info('Usuário criado com sucesso', {
      newUserId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      adminId: req.user.id,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department
      }
    });

  } catch (error) {
    logger.error('Erro ao criar usuário', {
      error: error.message,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticateToken, securityLogger, async (req, res) => {
  try {
    // Validação do payload
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      logger.warn('Tentativa de alteração de senha com dados inválidos', {
        userId: req.user.id,
        error: error.details[0].message,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message 
      });
    }

    const { currentPassword, newPassword } = value;

    // Validar senha atual
    const isValidPassword = await req.user.validatePassword(currentPassword);
    if (!isValidPassword) {
      logger.warn('Tentativa de alteração de senha com senha atual incorreta', {
        userId: req.user.id,
        email: req.user.email,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualizar senha
    req.user.password = newPassword;
    await req.user.hashPassword();
    User.update(req.user.id, req.user);

    logger.info('Senha alterada com sucesso', {
      userId: req.user.id,
      email: req.user.email,
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Senha alterada com sucesso' });

  } catch (error) {
    logger.error('Erro ao alterar senha', {
      error: error.message,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/user (informações do usuário atual)
router.get('/user', authenticateToken, securityLogger, (req, res) => {
  try {
    const user = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      department: req.user.department,
      isActive: req.user.isActive,
      createdAt: req.user.createdAt,
      lastLogin: req.user.lastLogin
    };

    logger.info('Informações do usuário consultadas', {
      userId: req.user.id,
      email: req.user.email,
      timestamp: new Date().toISOString()
    });

    res.json(user);

  } catch (error) {
    logger.error('Erro ao obter informações do usuário', {
      error: error.message,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/users (apenas admin)
router.get('/users', authenticateToken, authorizeAdmin, securityLogger, (req, res) => {
  try {
    const users = User.findAll().map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));

    logger.info('Lista de usuários consultada', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      userCount: users.length,
      timestamp: new Date().toISOString()
    });

    res.json({ users });

  } catch (error) {
    logger.error('Erro ao listar usuários', {
      error: error.message,
      adminId: req.user?.id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 