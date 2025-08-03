const User = require('../src/models/User');

function testUserAuth() {
  console.log('=== TESTE DE AUTENTICAÇÃO DO USUÁRIO ===');
  
  try {
    // 1. Verificar se o usuário admin existe
    console.log('\n1. Verificando usuário admin...');
    const adminUser = User.findByEmail('admin@empresa.com');
    
    if (adminUser) {
      console.log('✅ Usuário admin encontrado:');
      console.log('- ID:', adminUser.id);
      console.log('- Email:', adminUser.email);
      console.log('- Role:', adminUser.role);
      console.log('- IsActive:', adminUser.isActive);
      
      // 2. Verificar permissões
      console.log('\n2. Verificando permissões...');
      console.log('- canViewAudit():', adminUser.canViewAudit());
      console.log('- canManageUsers():', adminUser.canManageUsers());
      console.log('- canApprove():', adminUser.canApprove());
      console.log('- hasRole("admin"):', adminUser.hasRole('admin'));
      console.log('- hasAnyRole(["admin", "auditor"]):', adminUser.hasAnyRole(['admin', 'auditor']));
      
      // 3. Verificar se o usuário está ativo
      console.log('\n3. Verificando status do usuário...');
      console.log('- isActive:', adminUser.isActive);
      console.log('- isLocked():', adminUser.isLocked());
      
    } else {
      console.log('❌ Usuário admin não encontrado!');
    }
    
    // 4. Listar todos os usuários
    console.log('\n4. Listando todos os usuários...');
    const allUsers = User.findAll();
    console.log('Total de usuários:', allUsers.length);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - Ativo: ${user.isActive}`);
    });
    
    // 5. Verificar se há usuários com role 'auditor'
    console.log('\n5. Verificando usuários com role auditor...');
    const auditors = allUsers.filter(user => user.role === 'auditor');
    console.log('Usuários com role auditor:', auditors.length);
    
    if (auditors.length === 0) {
      console.log('⚠️  Não há usuários com role "auditor"');
      console.log('Isso pode explicar o problema de autorização');
    }
    
    // 6. Resumo
    console.log('\n6. RESUMO:');
    if (adminUser && adminUser.canViewAudit()) {
      console.log('✅ Usuário admin tem permissão para visualizar auditoria');
    } else {
      console.log('❌ Usuário admin NÃO tem permissão para visualizar auditoria');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testUserAuth(); 