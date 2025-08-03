const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testPeriodLogic() {
  console.log('=== TESTE DA LÓGICA DE PERÍODO ===');
  
  try {
    // 1. Login
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Testar período específico que está causando problema
    console.log('\n2. Testando período específico...');
    const testPeriod = {
      startDate: '2025-07-03',
      endDate: '2025-08-03'
    };
    
    console.log('Período de teste:', testPeriod);
    
    // 3. Verificar logs disponíveis
    console.log('\n3. Verificando logs disponíveis...');
    const logsResponse = await axios.get('http://localhost:3000/api/audit/logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const allLogs = logsResponse.data.logs;
    console.log('Total de logs disponíveis:', allLogs.length);
    
    if (allLogs.length > 0) {
      const sortedLogs = allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      console.log('Primeiro log:', sortedLogs[0].timestamp);
      console.log('Último log:', sortedLogs[sortedLogs.length - 1].timestamp);
      
      // Verificar logs no período específico
      const logsInPeriod = allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const startDate = new Date(testPeriod.startDate);
        const endDate = new Date(testPeriod.endDate);
        return logDate >= startDate && logDate <= endDate;
      });
      
      console.log('Logs no período solicitado:', logsInPeriod.length);
      
      if (logsInPeriod.length > 0) {
        console.log('Primeiros 3 logs no período:');
        logsInPeriod.slice(0, 3).forEach((log, index) => {
          console.log(`${index + 1}. ${log.timestamp} - ${log.action}`);
        });
      }
    }
    
    // 4. Testar exportação CSV com período específico
    console.log('\n4. Testando exportação CSV com período específico...');
    const csvResponse = await axios.get('http://localhost:3000/api/audit/export/csv', {
      params: testPeriod,
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
    const csvPath = path.join(__dirname, '../temp/period-test-csv.csv');
    fs.writeFileSync(csvPath, csvResponse.data);
    console.log('✅ CSV salvo em:', csvPath);
    
    // Analisar conteúdo do CSV
    const csvContent = csvResponse.data.toString('utf-8');
    const csvLines = csvContent.split('\n');
    console.log('✅ CSV - Total de linhas:', csvLines.length);
    console.log('✅ CSV - Primeira linha:', csvLines[0]);
    
    // Contar linhas de dados (excluindo cabeçalho)
    const dataLines = csvLines.filter(line => line.trim() && !line.startsWith('ID da Aprovacao'));
    console.log('✅ CSV - Linhas de dados:', dataLines.length);
    
    if (dataLines.length > 0) {
      console.log('✅ CSV - Primeira linha de dados:', dataLines[0]);
    }
    
    // 5. Testar exportação PDF com período específico
    console.log('\n5. Testando exportação PDF com período específico...');
    const pdfResponse = await axios.get('http://localhost:3000/api/audit/export/pdf', {
      params: testPeriod,
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
    const pdfPath = path.join(__dirname, '../temp/period-test-pdf.pdf');
    fs.writeFileSync(pdfPath, pdfResponse.data);
    console.log('✅ PDF salvo em:', pdfPath);
    
    // 6. Resumo
    console.log('\n6. RESUMO:');
    console.log('Período solicitado:', testPeriod);
    console.log('Total de logs disponíveis:', allLogs.length);
    console.log('Logs no período solicitado:', logsInPeriod ? logsInPeriod.length : 'N/A');
    console.log('CSV gerado com', csvResponse.data.length, 'bytes');
    console.log('PDF gerado com', pdfResponse.data.length, 'bytes');
    console.log('Linhas de dados no CSV:', dataLines.length);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response ? {
      status: error.response.status,
      data: error.response.data ? error.response.data.toString().substring(0, 200) : 'Sem dados'
    } : error.message);
  }
}

testPeriodLogic(); 