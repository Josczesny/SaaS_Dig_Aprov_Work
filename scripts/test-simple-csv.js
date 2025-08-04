const fs = require('fs');
const path = require('path');

// Teste simples de geração de CSV
console.log('=== TESTE SIMPLES DE CSV ===');

// Cabeçalhos simples
const headers = [
  'ID da Aprovacao',
  'Tipo de Solicitacao', 
  'Solicitante',
  'Aprovador',
  'Acao Realizada',
  'Justificativa',
  'Data/Hora',
  'Duracao do Processo'
];

// Dados de teste
const testData = [
  ['b79cd154-242...', 'Compra', 'Admin', 'Admin', 'Aprovado', 'Teste', '03/08/2025, 18:41:50', 'N/A'],
  ['a683032c-4cc...', 'Ferias', 'Admin', 'Admin', 'Rejeitado', 'Teste 2', '03/08/2025, 17:30:14', 'N/A']
];

// Gerar CSV
const csvLines = [];
const headerLine = headers.join(',').replace(/[\r\n]/g, '').replace(/\s+/g, ' ').trim();
csvLines.push(headerLine);

testData.forEach(row => {
  const escapedRow = row.map(field => {
    const escapedField = String(field)
      .replace(/"/g, '""')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .trim();
    return `"${escapedField}"`;
  });
  csvLines.push(escapedRow.join(','));
});

const csvContent = csvLines.join('\n');
const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
const finalContent = Buffer.concat([bom, Buffer.from(csvContent, 'utf-8')]);

// Salvar arquivo de teste
const testPath = path.join(__dirname, '../temp/test-simple-csv.csv');
fs.writeFileSync(testPath, finalContent);

console.log('CSV gerado com sucesso!');
console.log('Tamanho:', finalContent.length, 'bytes');
console.log('Cabeçalho gerado:', headerLine);
console.log('Primeiras linhas:', csvContent.substring(0, 200));

// Verificar o arquivo salvo
const savedContent = fs.readFileSync(testPath, 'utf8');
const lines = savedContent.split('\n');
console.log('\nArquivo salvo:');
console.log('Linha 1:', lines[0]);
console.log('Linha 2:', lines[1]);
console.log('Linha 3:', lines[2]); 