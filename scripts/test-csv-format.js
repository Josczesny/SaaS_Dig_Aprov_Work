const fs = require('fs');
const path = require('path');

// Ler o arquivo CSV gerado
const csvPath = path.join(__dirname, '../temp/exact-period-csv.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

console.log('=== TESTE DE FORMATAÇÃO CSV ===');
console.log('Tamanho do arquivo:', csvContent.length, 'bytes');

// Verificar as primeiras linhas
const lines = csvContent.split('\n');
console.log('\nPrimeiras 3 linhas:');
for (let i = 0; i < Math.min(3, lines.length); i++) {
  console.log(`Linha ${i + 1}: "${lines[i]}"`);
  console.log(`Tamanho: ${lines[i].length} caracteres`);
  console.log(`Bytes: ${Buffer.from(lines[i], 'utf8').length}`);
  console.log('---');
}

// Verificar se há caracteres especiais no cabeçalho
const header = lines[0];
console.log('\nAnálise do cabeçalho:');
console.log('Cabeçalho original:', header);
console.log('Cabeçalho em bytes:', Buffer.from(header, 'utf8'));
console.log('Cabeçalho em hex:', Buffer.from(header, 'utf8').toString('hex'));

// Verificar se há BOM
const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
const hasBOM = csvContent.startsWith(bom.toString('utf8'));
console.log('\nTem BOM:', hasBOM);

// Verificar se há quebras de linha no cabeçalho
const headerLines = header.split('\r');
console.log('Quebras de linha no cabeçalho:', headerLines.length);
if (headerLines.length > 1) {
  console.log('Cabeçalho quebrado:', headerLines);
} 