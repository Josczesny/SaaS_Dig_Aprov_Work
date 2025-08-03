const databaseService = require('../services/database');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

async function fixPasswords() {
  try {
    logger.info('Iniciando correção de senhas...');

    // Buscar todos os usuários
    const users = databaseService.findAllUsers();
    
    for (const user of users) {
      // Verificar se a senha já está hasheada
      if (!user.password.startsWith('$2a$')) {
        // Hash da senha
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        // Atualizar no banco
        databaseService.updateUser(user.id, {
          password: hashedPassword
        });
        
        logger.info('Senha corrigida', {
          email: user.email,
          role: user.role
        });
      } else {
        logger.info('Senha já está hasheada', {
          email: user.email
        });
      }
    }

    logger.info('Correção de senhas concluída', {
      usersProcessed: users.length
    });

  } catch (error) {
    logger.error('Erro na correção de senhas', {
      error: error.message
    });
    throw error;
  }
}

// Executar correção se chamado diretamente
if (require.main === module) {
  fixPasswords()
    .then(() => {
      console.log('Correção de senhas concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro na correção de senhas:', error.message);
      process.exit(1);
    });
}

module.exports = { fixPasswords }; 