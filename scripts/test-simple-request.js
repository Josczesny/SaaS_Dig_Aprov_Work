const axios = require('axios');

async function testSimpleRequest() {
  console.log('=== TESTE DE REQUISIÇÃO SIMPLES ===');
  
  try {
    // 1. Testar se o servidor está respondendo
    console.log('\n1. Testando se o servidor está respondendo...');
    const response = await axios.get('http://localhost:3000/');
    console.log('✅ Servidor respondendo:', response.status);
    
    // 2. Testar login
    console.log('\n2. Testando login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado:', loginResponse.status);
    console.log('Token:', token.substring(0, 20) + '...');
    
    // 3. Testar rota de auditoria simples
    console.log('\n3. Testando rota de auditoria simples...');
    const auditResponse = await axios.get('http://localhost:3000/api/audit/logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Rota de auditoria funcionando:', auditResponse.status);
    console.log('Dados retornados:', auditResponse.data.length, 'logs');
    
    // 4. Testar rota de exportação com logs
    console.log('\n4. Testando rota de exportação...');
    const exportResponse = await axios.get('http://localhost:3000/api/audit/export/csv', {
      params: {
        startDate: '2025-08-03',
        endDate: '2025-08-03'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ Exportação funcionando:', exportResponse.status);
    console.log('Tamanho do arquivo:', exportResponse.data.length, 'bytes');
    
    // 5. Verificar conteúdo
    const content = exportResponse.data.toString('utf-8');
    const lines = content.split('\n');
    console.log('Total de linhas:', lines.length);
    console.log('Primeira linha:', lines[0]);
    
    const dataLines = lines.filter(line => line.trim() && !line.startsWith('ID da Aprovacao'));
    console.log('Linhas de dados:', dataLines.length);
    
    if (dataLines.length > 0) {
      console.log('✅ DADOS ENCONTRADOS!');
    } else {
      console.log('❌ NENHUM DADO ENCONTRADO');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response ? {
      status: error.response.status,
      data: error.response.data ? error.response.data.toString().substring(0, 200) : 'Sem dados'
    } : error.message);
  }
}

testSimpleRequest(); 