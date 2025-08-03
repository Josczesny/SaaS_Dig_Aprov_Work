const axios = require('axios');

async function testForceNew() {
  console.log('=== TESTE FORÇANDO NOVA REQUISIÇÃO ===');
  
  try {
    // 1. Login
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Testar exportação com timestamp único
    console.log('\n2. Testando exportação com timestamp único...');
    const timestamp = Date.now();
    
    const csvResponse = await axios.get(`http://localhost:3000/api/audit/export/csv?startDate=2025-07-03&endDate=2025-08-03&_t=${timestamp}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': `Test-Force-New-${timestamp}/1.0`
      },
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    console.log('✅ CSV - Status:', csvResponse.status);
    console.log('✅ CSV - Tamanho:', csvResponse.data.length, 'bytes');
    console.log('✅ CSV - ETag:', csvResponse.headers.etag);
    console.log('✅ CSV - Cache-Control:', csvResponse.headers['cache-control']);
    
    // 3. Verificar se há logs no console do servidor
    console.log('\n3. Verificando logs do servidor...');
    console.log('Se não houver logs de debug acima, o servidor pode não estar processando as requisições');
    
    // 4. Testar uma requisição simples para verificar se o servidor está respondendo
    console.log('\n4. Testando requisição simples...');
    const simpleResponse = await axios.get(`http://localhost:3000/?_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('✅ Servidor respondendo:', simpleResponse.status);
    
  } catch (error) {
    console.error('❌ Erro:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      data: error.response.data ? error.response.data.toString().substring(0, 200) : 'Sem dados'
    } : error.message);
  }
}

testForceNew(); 