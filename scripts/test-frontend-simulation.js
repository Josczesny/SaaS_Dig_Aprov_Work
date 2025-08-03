const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testFrontendSimulation() {
  console.log('=== SIMULAÇÃO DO FRONTEND ===');
  
  try {
    // 1. Simular login como o frontend faz
    console.log('\n1. Simulando login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@empresa.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtido:', token.substring(0, 20) + '...');
    
    // 2. Simular exatamente a requisição do frontend para CSV
    console.log('\n2. Simulando requisição CSV do frontend...');
    const csvUrl = 'http://localhost:3000/api/audit/export/csv?startDate=2025-08-01&endDate=2025-08-31';
    console.log('URL:', csvUrl);
    
    const csvResponse = await axios.get(csvUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      responseType: 'arraybuffer',
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Aceitar apenas 2xx
      }
    });
    
    console.log('CSV - Status:', csvResponse.status);
    console.log('CSV - Tamanho:', csvResponse.data.length, 'bytes');
    console.log('CSV - Content-Type:', csvResponse.headers['content-type']);
    console.log('CSV - Content-Length:', csvResponse.headers['content-length']);
    
    // Verificar se o conteúdo é válido
    const csvContent = csvResponse.data.toString('utf-8');
    console.log('CSV - Primeiras 200 caracteres:');
    console.log(csvContent.substring(0, 200));
    
    // 3. Simular exatamente a requisição do frontend para PDF
    console.log('\n3. Simulando requisição PDF do frontend...');
    const pdfUrl = 'http://localhost:3000/api/audit/export/pdf?startDate=2025-08-01&endDate=2025-08-31';
    console.log('URL:', pdfUrl);
    
    const pdfResponse = await axios.get(pdfUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      responseType: 'arraybuffer',
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 300; // Aceitar apenas 2xx
      }
    });
    
    console.log('PDF - Status:', pdfResponse.status);
    console.log('PDF - Tamanho:', pdfResponse.data.length, 'bytes');
    console.log('PDF - Content-Type:', pdfResponse.headers['content-type']);
    console.log('PDF - Content-Length:', pdfResponse.headers['content-length']);
    
    // Verificar se é um PDF válido
    const pdfHeader = pdfResponse.data.slice(0, 4).toString();
    console.log('PDF - Header:', pdfHeader);
    console.log('PDF - É um PDF válido:', pdfHeader === '%PDF');
    
    // 4. Comparar com os testes anteriores
    console.log('\n4. Comparando resultados...');
    
    const webCsvPath = path.join(__dirname, '../temp/web-test-csv.csv');
    const webPdfPath = path.join(__dirname, '../temp/web-test-pdf.pdf');
    
    if (fs.existsSync(webCsvPath)) {
      const webCsv = fs.readFileSync(webCsvPath);
      console.log('CSV web anterior - Tamanho:', webCsv.length, 'bytes');
      console.log('CSV frontend simulado - Tamanho:', csvResponse.data.length, 'bytes');
      console.log('CSV - Mesmo tamanho:', webCsv.length === csvResponse.data.length);
    }
    
    if (fs.existsSync(webPdfPath)) {
      const webPdf = fs.readFileSync(webPdfPath);
      console.log('PDF web anterior - Tamanho:', webPdf.length, 'bytes');
      console.log('PDF frontend simulado - Tamanho:', pdfResponse.data.length, 'bytes');
      console.log('PDF - Mesmo tamanho:', webPdf.length === pdfResponse.data.length);
    }
    
    // 5. Salvar arquivos para verificação manual
    const frontendCsvPath = path.join(__dirname, '../temp/frontend-simulated-csv.csv');
    const frontendPdfPath = path.join(__dirname, '../temp/frontend-simulated-pdf.pdf');
    
    fs.writeFileSync(frontendCsvPath, csvResponse.data);
    fs.writeFileSync(frontendPdfPath, pdfResponse.data);
    
    console.log('\n5. Arquivos salvos para verificação:');
    console.log('- CSV:', frontendCsvPath);
    console.log('- PDF:', frontendPdfPath);
    
  } catch (error) {
    console.error('Erro na simulação:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      data: error.response.data ? error.response.data.toString().substring(0, 200) : 'Sem dados'
    } : error.message);
  }
}

testFrontendSimulation(); 