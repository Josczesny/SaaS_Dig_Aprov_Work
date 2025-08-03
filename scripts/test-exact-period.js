const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testExactPeriod() {
  console.log('=== TESTE COM PERÍODO EXATO ===');
  
  try {
    // 1. Login
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Testar com período exato do frontend
    console.log('\n2. Testando com período exato do frontend...');
    const period = {
      startDate: '2025-07-03',
      endDate: '2025-08-03'
    };
    
    console.log('Período:', period);
    
    // 3. Testar rota de logs primeiro
    console.log('\n3. Testando rota de logs...');
    const logsResponse = await axios.get('http://localhost:3000/api/audit/logs', {
      params: period,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Logs - Status:', logsResponse.status);
    console.log('✅ Logs - Total:', logsResponse.data.length);
    
    if (logsResponse.data.length > 0) {
      console.log('✅ Logs - Primeiro log:', logsResponse.data[0].timestamp);
      console.log('✅ Logs - Último log:', logsResponse.data[logsResponse.data.length - 1].timestamp);
    }
    
    // 4. Testar exportação CSV
    console.log('\n4. Testando exportação CSV...');
    const csvResponse = await axios.get('http://localhost:3000/api/audit/export/csv', {
      params: period,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ CSV - Status:', csvResponse.status);
    console.log('✅ CSV - Tamanho:', csvResponse.data.length, 'bytes');
    
    // Salvar CSV para análise
    const csvPath = path.join(__dirname, '../temp/exact-period-csv.csv');
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
    
    // 5. Testar exportação PDF
    console.log('\n5. Testando exportação PDF...');
    const pdfResponse = await axios.get('http://localhost:3000/api/audit/export/pdf', {
      params: period,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'Cache-Control': 'no-cache'
      },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ PDF - Status:', pdfResponse.status);
    console.log('✅ PDF - Tamanho:', pdfResponse.data.length, 'bytes');
    
    // Salvar PDF para análise
    const pdfPath = path.join(__dirname, '../temp/exact-period-pdf.pdf');
    fs.writeFileSync(pdfPath, pdfResponse.data);
    console.log('✅ PDF salvo em:', pdfPath);
    
    // 6. Resumo
    console.log('\n6. RESUMO:');
    console.log('Período testado:', period);
    console.log('Logs encontrados via API:', logsResponse.data.length);
    console.log('CSV gerado:', csvResponse.data.length, 'bytes');
    console.log('PDF gerado:', pdfResponse.data.length, 'bytes');
    console.log('Linhas de dados no CSV:', dataLines.length);
    
    if (dataLines.length === 0) {
      console.log('❌ PROBLEMA: CSV não contém dados!');
      console.log('Isso indica que a lógica de período não está funcionando corretamente');
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

testExactPeriod(); 