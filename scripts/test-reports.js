const auditService = require('../src/services/auditService');
const databaseService = require('../src/services/database');

async function testReports() {
  console.log('=== TESTE DE RELATÓRIOS ===');
  
  try {
    // 1. Verificar dados no banco
    console.log('\n1. Verificando dados no banco...');
    const allLogs = await auditService.getAuditLogs({});
    console.log(`Total de logs no banco: ${allLogs.length}`);
    
    if (allLogs.length > 0) {
      console.log('Primeiro log:', allLogs[0]);
      console.log('Último log:', allLogs[allLogs.length - 1]);
    }
    
    // 2. Testar ajuste de período
    console.log('\n2. Testando ajuste de período...');
    const adjustedPeriod = await auditService.adjustPeriodToIncludeData('2025-01-01', '2025-12-31');
    console.log('Período ajustado:', adjustedPeriod);
    
    // 3. Testar geração de CSV
    console.log('\n3. Testando geração de CSV...');
    const csvBuffer = await auditService.generateCSV(allLogs, adjustedPeriod);
    console.log('Tamanho do CSV:', csvBuffer.length, 'bytes');
    console.log('Primeiras 500 caracteres do CSV:');
    console.log(csvBuffer.toString('utf-8').substring(0, 500));
    
    // 4. Testar geração de PDF
    console.log('\n4. Testando geração de PDF...');
    const pdfBuffer = await auditService.generatePDF(allLogs, adjustedPeriod);
    console.log('Tamanho do PDF:', pdfBuffer.length, 'bytes');
    
    // 5. Salvar arquivos para teste
    const fs = require('fs');
    const path = require('path');
    
    const testDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(testDir, 'test-report.csv'), csvBuffer);
    fs.writeFileSync(path.join(testDir, 'test-report.pdf'), pdfBuffer);
    
    console.log('\n5. Arquivos salvos em:', testDir);
    console.log('- test-report.csv');
    console.log('- test-report.pdf');
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testReports(); 