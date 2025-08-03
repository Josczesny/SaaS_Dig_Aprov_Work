const databaseService = require('../services/database');
const User = require('../models/User');
const { logger } = require('../utils/logger');

async function migrateUsers() {
  try {
    logger.info('Iniciando migração de usuários...');

    // Usuários padrão para migração
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

    // Verificar se já existem usuários no banco
    const existingUsers = databaseService.findAllUsers();
    
    if (existingUsers.length > 0) {
      logger.info('Usuários já existem no banco de dados', {
        count: existingUsers.length
      });
      return;
    }

    // Criar usuários no banco
    for (const userData of defaultUsers) {
      try {
        await User.create(userData);
        logger.info('Usuário criado', {
          email: userData.email,
          role: userData.role
        });
      } catch (error) {
        logger.error('Erro ao criar usuário', {
          email: userData.email,
          error: error.message
        });
      }
    }

    logger.info('Migração de usuários concluída', {
      usersCreated: defaultUsers.length
    });

  } catch (error) {
    logger.error('Erro na migração de usuários', {
      error: error.message
    });
    throw error;
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log('Migração concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro na migração:', error.message);
      process.exit(1);
    });
}

module.exports = { migrateUsers }; 