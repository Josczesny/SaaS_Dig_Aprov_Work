const auditService = require('../src/services/auditService');

async function testDirectService() {
  console.log('=== TESTE DIRETO DO SERVIÇO ===');
  
  try {
    
    // 1. Verificar todos os logs
    console.log('\n1. Verificando todos os logs...');
    const allLogs = await auditService.getAuditLogs({});
    console.log('Total de logs:', allLogs.length);
    
    if (allLogs.length > 0) {
      const sortedLogs = allLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      console.log('Primeiro log:', sortedLogs[0].timestamp);
      console.log('Último log:', sortedLogs[sortedLogs.length - 1].timestamp);
    }
    
    // 2. Testar ajuste de período
    console.log('\n2. Testando ajuste de período...');
    const testPeriod = {
      startDate: '2025-07-03',
      endDate: '2025-08-03'
    };
    
    console.log('Período de teste:', testPeriod);
    
    const adjustedPeriod = await auditService.adjustPeriodToIncludeData(
      testPeriod.startDate, 
      testPeriod.endDate
    );
    
    console.log('Período ajustado:', adjustedPeriod);
    
    // 3. Verificar logs no período ajustado
    console.log('\n3. Verificando logs no período ajustado...');
    const logsInAdjustedPeriod = await auditService.getAuditLogs({
      startDate: adjustedPeriod.startDate,
      endDate: adjustedPeriod.endDate
    });
    
    console.log('Logs no período ajustado:', logsInAdjustedPeriod.length);
    
    if (logsInAdjustedPeriod.length > 0) {
      console.log('Primeiros 3 logs no período ajustado:');
      logsInAdjustedPeriod.slice(0, 3).forEach((log, index) => {
        console.log(`${index + 1}. ${log.timestamp} - ${log.action}`);
      });
    }
    
    // 4. Testar exportação
    console.log('\n4. Testando exportação...');
    const csvContent = await auditService.exportAuditLogs({
      format: 'csv',
      startDate: testPeriod.startDate,
      endDate: testPeriod.endDate
    });
    
    console.log('CSV gerado - Tamanho:', csvContent.length, 'bytes');
    
    const csvText = csvContent.toString('utf-8');
    const csvLines = csvText.split('\n');
    console.log('CSV - Total de linhas:', csvLines.length);
    console.log('CSV - Primeira linha:', csvLines[0]);
    
    // Contar linhas de dados
    const dataLines = csvLines.filter(line => line.trim() && !line.startsWith('ID da Aprovacao'));
    console.log('CSV - Linhas de dados:', dataLines.length);
    
    // 5. Resumo
    console.log('\n5. RESUMO:');
    console.log('Período solicitado:', testPeriod);
    console.log('Período ajustado:', adjustedPeriod);
    console.log('Total de logs disponíveis:', allLogs.length);
    console.log('Logs no período ajustado:', logsInAdjustedPeriod.length);
    console.log('CSV gerado com', csvContent.length, 'bytes');
    console.log('Linhas de dados no CSV:', dataLines.length);
    
  } catch (error) {
    console.error('❌ Erro no teste direto:', error);
  }
}

testDirectService(); 