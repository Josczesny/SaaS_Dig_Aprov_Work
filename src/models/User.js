const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const databaseService = require('../services/database');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.role = data.role || 'user';
    this.department = data.department;
    this.isActive = data.isActive !== false;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.lastLogin = data.lastLogin;
    this.failedLoginAttempts = data.failedLoginAttempts || 0;
    this.lockedUntil = data.lockedUntil;
    
    // Converter valores do banco para boolean
    if (typeof this.isActive === 'number') {
      this.isActive = this.isActive === 1;
    }
  }

  // Métodos de instância
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  async validatePassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  isLocked() {
    if (!this.lockedUntil) return false;
    return new Date() < new Date(this.lockedUntil);
  }

  recordFailedLogin() {
    this.failedLoginAttempts++;
    if (this.failedLoginAttempts >= 5) {
      // Bloquear por 15 minutos após 5 tentativas falhadas
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
  }

  recordSuccessfulLogin() {
    this.failedLoginAttempts = 0;
    this.lockedUntil = null;
    this.lastLogin = new Date().toISOString();
  }

  recordFailedLogin() {
    this.failedLoginAttempts++;
    if (this.failedLoginAttempts >= 5) {
      // Bloquear por 15 minutos após 5 tentativas falhadas
      this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }
  }

  // Métodos estáticos
  static async create(userData) {
    const user = new User(userData);
    await user.hashPassword();
    
    try {
      databaseService.createUser(user);
      return user;
    } catch (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
  }

  static findById(id) {
    const userData = databaseService.findUserById(id);
    return userData ? new User(userData) : null;
  }

  static findByEmail(email) {
    const userData = databaseService.findUserByEmail(email);
    return userData ? new User(userData) : null;
  }

  static findAll() {
    const usersData = databaseService.findAllUsers();
    return usersData.map(userData => new User(userData));
  }

  static update(id, updates) {
    try {
      // Garantir que valores null sejam tratados corretamente
      const sanitizedUpdates = {};
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) {
          sanitizedUpdates[key] = null;
        } else {
          sanitizedUpdates[key] = value;
        }
      }
      
      databaseService.updateUser(id, sanitizedUpdates);
      return this.findById(id);
    } catch (error) {
      throw new Error(`Erro ao atualizar usuário: ${error.message}`);
    }
  }

  static delete(id) {
    try {
      return databaseService.deleteUser(id);
    } catch (error) {
      throw new Error(`Erro ao deletar usuário: ${error.message}`);
    }
  }

  static clearData() {
    databaseService.clearAllData();
  }

  // Validação de roles
  hasRole(role) {
    return this.role === role;
  }

  hasAnyRole(roles) {
    return roles.includes(this.role);
  }

  canApprove() {
    return ['admin', 'manager', 'approver'].includes(this.role);
  }

  canManageUsers() {
    return ['admin'].includes(this.role);
  }

  canViewAudit() {
    return ['admin', 'auditor'].includes(this.role);
  }
}

// Usuários padrão para desenvolvimento
const initializeDefaultUsers = async () => {
  const defaultUsers = [
    {
      email: 'admin@empresa.com',
      password: 'Admin123!',
      name: 'Administrador Sistema',
      role: 'admin',
      department: 'TI'
    },
    {
      email: 'maria.santos@empresa.com',
      password: 'Manager123!',
      name: 'Maria Santos',
      role: 'manager',
      department: 'Financeiro'
    },
    {
      email: 'joao.silva@empresa.com',
      password: 'User123!',
      name: 'João Silva',
      role: 'user',
      department: 'TI'
    },
    {
      email: 'ana.rodrigues@empresa.com',
      password: 'Approver123!',
      name: 'Ana Rodrigues',
      role: 'approver',
      department: 'RH'
    }
  ];

  for (const userData of defaultUsers) {
    if (!User.findByEmail(userData.email)) {
      await User.create(userData);
    }
  }
};

// Inicializar usuários padrão apenas se não estiver em teste
if (process.env.NODE_ENV !== 'test') {
  initializeDefaultUsers();
}

module.exports = User; 