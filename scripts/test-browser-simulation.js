const fetch = require('node-fetch').default;
const fs = require('fs');
const path = require('path');

async function testBrowserSimulation() {
  console.log('=== SIMULAÇÃO DO NAVEGADOR ===');
  
  try {
    // 1. Fazer login para obter token
    console.log('\n1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@empresa.com',
        password: 'Admin123!'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('Token obtido:', token.substring(0, 20) + '...');
    
    // 2. Simular fetch do navegador para CSV
    console.log('\n2. Simulando fetch do navegador para CSV...');
    const csvUrl = 'http://localhost:3000/api/audit/export/csv?startDate=2025-08-01&endDate=2025-08-31';
    console.log('URL:', csvUrl);
    
    const csvResponse = await fetch(csvUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('CSV - Status:', csvResponse.status);
    console.log('CSV - Headers:', Object.fromEntries(csvResponse.headers.entries()));
    
    if (csvResponse.ok) {
      console.log('CSV - Resposta OK, criando blob...');
      const csvBlob = await csvResponse.blob();
      console.log('CSV - Blob criado:', csvBlob.size, 'bytes');
      console.log('CSV - Blob type:', csvBlob.type);
      
      // Converter blob para buffer para salvar
      const csvBuffer = await csvBlob.arrayBuffer();
      const csvData = Buffer.from(csvBuffer);
      
      const csvPath = path.join(__dirname, '../temp/browser-simulated-csv.csv');
      fs.writeFileSync(csvPath, csvData);
      console.log('CSV salvo em:', csvPath);
      
      // Verificar conteúdo
      const csvContent = csvData.toString('utf-8');
      console.log('CSV - Primeiras 200 caracteres:');
      console.log(csvContent.substring(0, 200));
    } else {
      console.error('CSV - Erro na resposta:', csvResponse.status, csvResponse.statusText);
    }
    
    // 3. Simular fetch do navegador para PDF
    console.log('\n3. Simulando fetch do navegador para PDF...');
    const pdfUrl = 'http://localhost:3000/api/audit/export/pdf?startDate=2025-08-01&endDate=2025-08-31';
    console.log('URL:', pdfUrl);
    
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log('PDF - Status:', pdfResponse.status);
    console.log('PDF - Headers:', Object.fromEntries(pdfResponse.headers.entries()));
    
    if (pdfResponse.ok) {
      console.log('PDF - Resposta OK, criando blob...');
      const pdfBlob = await pdfResponse.blob();
      console.log('PDF - Blob criado:', pdfBlob.size, 'bytes');
      console.log('PDF - Blob type:', pdfBlob.type);
      
      // Converter blob para buffer para salvar
      const pdfBuffer = await pdfBlob.arrayBuffer();
      const pdfData = Buffer.from(pdfBuffer);
      
      const pdfPath = path.join(__dirname, '../temp/browser-simulated-pdf.pdf');
      fs.writeFileSync(pdfPath, pdfData);
      console.log('PDF salvo em:', pdfPath);
      
      // Verificar se é um PDF válido
      const pdfHeader = pdfData.slice(0, 4).toString();
      console.log('PDF - Header:', pdfHeader);
      console.log('PDF - É um PDF válido:', pdfHeader === '%PDF');
    } else {
      console.error('PDF - Erro na resposta:', pdfResponse.status, pdfResponse.statusText);
    }
    
    // 4. Comparar com testes anteriores
    console.log('\n4. Comparando resultados...');
    
    const webCsvPath = path.join(__dirname, '../temp/web-test-csv.csv');
    const webPdfPath = path.join(__dirname, '../temp/web-test-pdf.pdf');
    
    if (fs.existsSync(webCsvPath)) {
      const webCsv = fs.readFileSync(webCsvPath);
      const browserCsv = fs.readFileSync(path.join(__dirname, '../temp/browser-simulated-csv.csv'));
      console.log('CSV web - Tamanho:', webCsv.length, 'bytes');
      console.log('CSV browser simulado - Tamanho:', browserCsv.length, 'bytes');
      console.log('CSV - Mesmo tamanho:', webCsv.length === browserCsv.length);
    }
    
    if (fs.existsSync(webPdfPath)) {
      const webPdf = fs.readFileSync(webPdfPath);
      const browserPdf = fs.readFileSync(path.join(__dirname, '../temp/browser-simulated-pdf.pdf'));
      console.log('PDF web - Tamanho:', webPdf.length, 'bytes');
      console.log('PDF browser simulado - Tamanho:', browserPdf.length, 'bytes');
      console.log('PDF - Mesmo tamanho:', webPdf.length === browserPdf.length);
    }
    
  } catch (error) {
    console.error('Erro na simulação do navegador:', error);
  }
}

testBrowserSimulation(); 