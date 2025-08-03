const auditService = require('../src/services/auditService');
const fs = require('fs');
const path = require('path');

async function testDirectExport() {
  console.log('=== TESTE DIRETO DE EXPORTAÇÃO ===');
  
  try {
    // 1. Verificar dados no banco
    console.log('\n1. Verificando dados no banco...');
    const allLogs = await auditService.getAuditLogs({});
    console.log(`Total de logs no banco: ${allLogs.length}`);
    
    if (allLogs.length === 0) {
      console.log('Nenhum log encontrado no banco!');
      return;
    }
    
    // 2. Testar exportação CSV com período que tem dados parciais
    console.log('\n2. Testando exportação CSV com período que tem dados parciais...');
    const csvBuffer = await auditService.exportAuditLogs({
      format: 'csv',
      startDate: '2025-08-01', // Período que pode ter dados parciais
      endDate: '2025-08-31'    // Período que pode ter dados parciais
    });
    
    console.log('CSV gerado - Tamanho:', csvBuffer.length, 'bytes');
    console.log('Primeiras 300 caracteres do CSV:');
    console.log(csvBuffer.toString('utf-8').substring(0, 300));
    
    // 3. Testar exportação PDF com período que tem dados parciais
    console.log('\n3. Testando exportação PDF com período que tem dados parciais...');
    const pdfBuffer = await auditService.exportAuditLogs({
      format: 'pdf',
      startDate: '2025-08-01', // Período que pode ter dados parciais
      endDate: '2025-08-31'    // Período que pode ter dados parciais
    });
    
    console.log('PDF gerado - Tamanho:', pdfBuffer.length, 'bytes');
    
    // 4. Salvar arquivos para verificação
    const testDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const csvPath = path.join(testDir, 'direct-test-csv.csv');
    const pdfPath = path.join(testDir, 'direct-test-pdf.pdf');
    
    fs.writeFileSync(csvPath, csvBuffer);
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    console.log('\n4. Arquivos salvos:');
    console.log('- CSV:', csvPath);
    console.log('- PDF:', pdfPath);
    
    // 5. Verificar conteúdo dos arquivos
    console.log('\n5. Verificando conteúdo dos arquivos...');
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    console.log('CSV - Primeiras 5 linhas:');
    console.log(csvContent.split('\n').slice(0, 5).join('\n'));
    
    const pdfContent = fs.readFileSync(pdfPath);
    console.log('PDF - Primeiros 100 bytes (hex):');
    console.log(pdfContent.slice(0, 100).toString('hex'));
    
    // 6. Verificar se os arquivos são válidos
    console.log('\n6. Verificando validade dos arquivos...');
    
    // Verificar CSV
    const csvLines = csvContent.split('\n');
    console.log('CSV - Total de linhas:', csvLines.length);
    console.log('CSV - Primeira linha:', csvLines[0]);
    console.log('CSV - Segunda linha:', csvLines[1]);
    
    // Verificar PDF (deve começar com %PDF)
    const pdfHeader = pdfContent.slice(0, 4).toString();
    console.log('PDF - Header:', pdfHeader);
    console.log('PDF - É um PDF válido:', pdfHeader === '%PDF');
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testDirectExport(); 