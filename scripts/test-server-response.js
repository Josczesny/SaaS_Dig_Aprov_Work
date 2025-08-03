const axios = require('axios');

async function testServerResponse() {
  console.log('=== TESTE DE RESPOSTA DO SERVIDOR ===');
  
  try {
    // 1. Testar se o servidor está respondendo
    console.log('\n1. Testando resposta básica...');
    const response = await axios.get('http://localhost:3000/');
    console.log('✅ Servidor respondendo:', response.status);
    
    // 2. Testar login com logs
    console.log('\n2. Testando login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado:', loginResponse.status);
    console.log('Token:', token.substring(0, 20) + '...');
    
    // 3. Testar rota de auditoria com logs detalhados
    console.log('\n3. Testando rota de auditoria...');
    console.log('Fazendo requisição para: http://localhost:3000/api/audit/logs');
    console.log('Headers:', {
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
      'Accept': 'application/json'
    });
    
    const auditResponse = await axios.get('http://localhost:3000/api/audit/logs', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Rota de auditoria - Status:', auditResponse.status);
    console.log('✅ Rota de auditoria - Headers:', auditResponse.headers);
    console.log('✅ Rota de auditoria - Data:', auditResponse.data);
    
    // 4. Testar rota de exportação com logs detalhados
    console.log('\n4. Testando rota de exportação...');
    console.log('Fazendo requisição para: http://localhost:3000/api/audit/export/csv');
    console.log('Params:', { startDate: '2025-07-03', endDate: '2025-08-03' });
    
    const exportResponse = await axios.get('http://localhost:3000/api/audit/export/csv', {
      params: {
        startDate: '2025-07-03',
        endDate: '2025-08-03'
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*'
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ Exportação - Status:', exportResponse.status);
    console.log('✅ Exportação - Headers:', exportResponse.headers);
    console.log('✅ Exportação - Tamanho:', exportResponse.data.length, 'bytes');
    
    // 5. Verificar se há logs no console do servidor
    console.log('\n5. Verificando logs do servidor...');
    console.log('Se não houver logs de debug acima, o servidor pode não estar processando as requisições');
    
  } catch (error) {
    console.error('❌ Erro:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      data: error.response.data ? error.response.data.toString().substring(0, 200) : 'Sem dados'
    } : error.message);
  }
}

testServerResponse(); 