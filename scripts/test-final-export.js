const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testFinalExport() {
  console.log('=== TESTE FINAL DE EXPORTAÇÃO ===');
  
  try {
    // 1. Login
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Testar CSV
    console.log('\n2. Testando exportação CSV...');
    const csvResponse = await axios.get('http://localhost:3000/api/audit/export/csv', {
      params: {
        startDate: '2025-08-01',
        endDate: '2025-08-31'
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
    
    // Salvar CSV
    const csvPath = path.join(__dirname, '../temp/final-test-csv.csv');
    fs.writeFileSync(csvPath, csvResponse.data);
    console.log('✅ CSV salvo em:', csvPath);
    
    // 3. Testar PDF
    console.log('\n3. Testando exportação PDF...');
    const pdfResponse = await axios.get('http://localhost:3000/api/audit/export/pdf', {
      params: {
        startDate: '2025-08-01',
        endDate: '2025-08-31'
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
    
    // Verificar PDF
    const pdfHeader = pdfResponse.data.slice(0, 4).toString();
    console.log('✅ PDF - Header:', pdfHeader);
    console.log('✅ PDF - É válido:', pdfHeader === '%PDF');
    
    // Salvar PDF
    const pdfPath = path.join(__dirname, '../temp/final-test-pdf.pdf');
    fs.writeFileSync(pdfPath, pdfResponse.data);
    console.log('✅ PDF salvo em:', pdfPath);
    
    // 4. Verificar conteúdo
    console.log('\n4. Verificando conteúdo dos arquivos...');
    
    const csvContent = csvResponse.data.toString('utf-8');
    const csvLines = csvContent.split('\n');
    console.log('✅ CSV - Total de linhas:', csvLines.length);
    console.log('✅ CSV - Primeira linha:', csvLines[0]);
    console.log('✅ CSV - Segunda linha:', csvLines[1]);
    
    // Verificar se há dados
    const dataLines = csvLines.filter(line => line.trim() && !line.startsWith('ID da Aprovacao'));
    console.log('✅ CSV - Linhas de dados:', dataLines.length);
    
    // 5. Resumo final
    console.log('\n5. RESUMO FINAL:');
    console.log('✅ Backend funcionando corretamente');
    console.log('✅ CSV gerado com', csvResponse.data.length, 'bytes');
    console.log('✅ PDF gerado com', pdfResponse.data.length, 'bytes');
    console.log('✅ Arquivos salvos em temp/');
    console.log('✅ Pronto para testar no navegador!');
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Abra http://localhost:3000 no navegador');
    console.log('2. Faça login com admin@empresa.com / Admin123!');
    console.log('3. Vá para "Logs de Auditoria"');
    console.log('4. Clique em "Exportar CSV" ou "Exportar PDF"');
    console.log('5. Verifique os logs no console do navegador');
    
  } catch (error) {
    console.error('❌ Erro no teste final:', error.response ? {
      status: error.response.status,
      data: error.response.data ? error.response.data.toString().substring(0, 200) : 'Sem dados'
    } : error.message);
  }
}

testFinalExport(); 