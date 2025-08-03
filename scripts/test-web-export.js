const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testWebExport() {
  console.log('=== TESTE DE EXPORTAÇÃO VIA HTTP ===');
  
  try {
    // 1. Fazer login para obter token
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtido:', token.substring(0, 20) + '...');
    
    // 2. Testar exportação CSV
    console.log('\n2. Testando exportação CSV...');
    const csvResponse = await axios.get('http://localhost:3000/api/audit/export/csv', {
      params: {
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    });
    
    console.log('CSV - Status:', csvResponse.status);
    console.log('CSV - Tamanho:', csvResponse.data.length, 'bytes');
    console.log('CSV - Content-Type:', csvResponse.headers['content-type']);
    
    // Salvar CSV para verificação
    const csvPath = path.join(__dirname, '../temp/web-test-csv.csv');
    fs.writeFileSync(csvPath, csvResponse.data);
    console.log('CSV salvo em:', csvPath);
    
    // Verificar conteúdo
    const csvContent = csvResponse.data.toString('utf-8');
    console.log('CSV - Primeiras 300 caracteres:');
    console.log(csvContent.substring(0, 300));
    
    // 3. Testar exportação PDF
    console.log('\n3. Testando exportação PDF...');
    const pdfResponse = await axios.get('http://localhost:3000/api/audit/export/pdf', {
      params: {
        startDate: '2025-08-01',
        endDate: '2025-08-31'
      },
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'arraybuffer'
    });
    
    console.log('PDF - Status:', pdfResponse.status);
    console.log('PDF - Tamanho:', pdfResponse.data.length, 'bytes');
    console.log('PDF - Content-Type:', pdfResponse.headers['content-type']);
    
    // Salvar PDF para verificação
    const pdfPath = path.join(__dirname, '../temp/web-test-pdf.pdf');
    fs.writeFileSync(pdfPath, pdfResponse.data);
    console.log('PDF salvo em:', pdfPath);
    
    // Verificar se é um PDF válido
    const pdfHeader = pdfResponse.data.slice(0, 4).toString();
    console.log('PDF - Header:', pdfHeader);
    console.log('PDF - É um PDF válido:', pdfHeader === '%PDF');
    
    // 4. Verificar se os arquivos são válidos
    console.log('\n4. Verificando arquivos salvos...');
    
    const csvFile = fs.readFileSync(csvPath);
    console.log('CSV salvo - Tamanho:', csvFile.length, 'bytes');
    
    const pdfFile = fs.readFileSync(pdfPath);
    console.log('PDF salvo - Tamanho:', pdfFile.length, 'bytes');
    
    // Verificar se os arquivos são diferentes dos testes diretos
    const directCsvPath = path.join(__dirname, '../temp/direct-test-csv.csv');
    const directPdfPath = path.join(__dirname, '../temp/direct-test-pdf.pdf');
    
    if (fs.existsSync(directCsvPath)) {
      const directCsv = fs.readFileSync(directCsvPath);
      console.log('CSV direto - Tamanho:', directCsv.length, 'bytes');
      console.log('CSV web vs direto - Mesmo tamanho:', csvFile.length === directCsv.length);
    }
    
    if (fs.existsSync(directPdfPath)) {
      const directPdf = fs.readFileSync(directPdfPath);
      console.log('PDF direto - Tamanho:', directPdf.length, 'bytes');
      console.log('PDF web vs direto - Mesmo tamanho:', pdfFile.length === directPdf.length);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error.response ? {
      status: error.response.status,
      data: error.response.data.toString().substring(0, 200)
    } : error.message);
  }
}

testWebExport(); 