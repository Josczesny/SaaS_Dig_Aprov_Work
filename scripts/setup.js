const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Sistema de Aprovação Digital...\n');

// Criar diretórios necessários
const dirs = ['logs', 'uploads', 'temp'];
dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Criado diretório: ${dir}`);
  } else {
    console.log(`📁 Diretório já existe: ${dir}`);
  }
});

// Verificar arquivo .env
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  Arquivo .env não encontrado!');
  console.log('📝 Copie env.example para .env e configure as variáveis:');
  console.log('   cp env.example .env');
  console.log('');
} else {
  console.log('✅ Arquivo .env encontrado');
}

// Verificar dependências
console.log('\n📦 Verificando dependências...');
try {
  require('express');
  require('nodemailer');
  require('winston');
  require('joi');
  console.log('✅ Todas as dependências principais estão instaladas');
} catch (error) {
  console.log('❌ Algumas dependências estão faltando');
  console.log('💡 Execute: npm install');
}

console.log('\n🎯 Sistema pronto para uso!');
console.log('📖 Execute "npm run dev" para iniciar o servidor');
console.log('🧪 Execute "npm test" para rodar os testes'); 