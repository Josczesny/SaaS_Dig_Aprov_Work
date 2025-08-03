const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testFrontendExact() {
  console.log('=== TESTE EXATO DO FRONTEND ===');
  
  try {
    // 1. Login exato como o frontend
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    console.log('Token:', token.substring(0, 20) + '...');
    
    // 2. Testar exatamente como o frontend faz
    console.log('\n2. Testando exportação CSV exata...');
    
    // Simular exatamente a requisição do frontend
    const csvResponse = await axios.get('http://localhost:3000/api/audit/export/csv', {
      params: {
        startDate: '2025-07-03',
        endDate: '2025-08-03'
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ CSV - Status:', csvResponse.status);
    console.log('✅ CSV - Tamanho:', csvResponse.data.length, 'bytes');
    console.log('✅ CSV - Content-Type:', csvResponse.headers['content-type']);
    
    // Salvar CSV para análise
    const csvPath = path.join(__dirname, '../temp/frontend-exact-csv.csv');
    fs.writeFileSync(csvPath, csvResponse.data);
    console.log('✅ CSV salvo em:', csvPath);
    
    // Analisar conteúdo
    const csvContent = csvResponse.data.toString('utf-8');
    const csvLines = csvContent.split('\n');
    console.log('✅ CSV - Total de linhas:', csvLines.length);
    console.log('✅ CSV - Primeira linha:', csvLines[0]);
    
    // Contar linhas de dados
    const dataLines = csvLines.filter(line => line.trim() && !line.startsWith('ID da Aprovacao'));
    console.log('✅ CSV - Linhas de dados:', dataLines.length);
    
    if (dataLines.length > 0) {
      console.log('✅ CSV - Primeira linha de dados:', dataLines[0]);
    }
    
    // 3. Testar PDF exato
    console.log('\n3. Testando exportação PDF exata...');
    
    const pdfResponse = await axios.get('http://localhost:3000/api/audit/export/pdf', {
      params: {
        startDate: '2025-07-03',
        endDate: '2025-08-03'
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ PDF - Status:', pdfResponse.status);
    console.log('✅ PDF - Tamanho:', pdfResponse.data.length, 'bytes');
    console.log('✅ PDF - Content-Type:', pdfResponse.headers['content-type']);
    
    // Salvar PDF para análise
    const pdfPath = path.join(__dirname, '../temp/frontend-exact-pdf.pdf');
    fs.writeFileSync(pdfPath, pdfResponse.data);
    console.log('✅ PDF salvo em:', pdfPath);
    
    // 4. Comparar com teste direto
    console.log('\n4. Comparando com teste direto...');
    
    const directCsvPath = path.join(__dirname, '../temp/direct-test-csv.csv');
    if (fs.existsSync(directCsvPath)) {
      const directCsv = fs.readFileSync(directCsvPath);
      console.log('CSV direto - Tamanho:', directCsv.length, 'bytes');
      console.log('CSV frontend - Tamanho:', csvResponse.data.length, 'bytes');
      console.log('Diferença:', directCsv.length - csvResponse.data.length, 'bytes');
    }
    
    // 5. Verificar logs do servidor
    console.log('\n5. Verificando logs do servidor...');
    console.log('Se o problema persistir, verifique os logs do servidor para ver se há erros');
    
    // 6. Resumo
    console.log('\n6. RESUMO:');
    console.log('CSV gerado via HTTP:', csvResponse.data.length, 'bytes');
    console.log('PDF gerado via HTTP:', pdfResponse.data.length, 'bytes');
    console.log('Linhas de dados no CSV:', dataLines.length);
    
    if (dataLines.length === 0) {
      console.log('❌ PROBLEMA: CSV não contém dados!');
      console.log('Isso indica que há uma diferença entre o teste direto e a API HTTP');
    } else {
      console.log('✅ SUCESSO: CSV contém dados!');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response ? {
      status: error.response.status,
      data: error.response.data ? error.response.data.toString().substring(0, 200) : 'Sem dados'
    } : error.message);
  }
}

testFrontendExact(); 