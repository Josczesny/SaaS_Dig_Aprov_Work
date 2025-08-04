const fs = require('fs');
const path = require('path');

console.log('=== TESTE DETALHADO DE FORMATAÇÃO CSV ===');

// Ler o arquivo CSV gerado pelo sistema
const csvPath = path.join(__dirname, '../temp/exact-period-csv.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

console.log('Tamanho do arquivo:', csvContent.length, 'bytes');

// Verificar as primeiras linhas
const lines = csvContent.split('\n');
console.log('\nPrimeiras 3 linhas:');
for (let i = 0; i < Math.min(3, lines.length); i++) {
  console.log(`Linha ${i + 1}: "${lines[i]}"`);
  console.log(`Tamanho: ${lines[i].length} caracteres`);
  console.log(`Bytes: ${Buffer.from(lines[i], 'utf8').length}`);
  
  // Verificar se há vírgulas na linha
  const commas = (lines[i].match(/,/g) || []).length;
  console.log(`Vírgulas encontradas: ${commas}`);
  
  // Verificar se há aspas na linha
  const quotes = (lines[i].match(/"/g) || []).length;
  console.log(`Aspas encontradas: ${quotes}`);
  
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

// Verificar se há caracteres de controle
console.log('\nCaracteres de controle no cabeçalho:');
for (let i = 0; i < header.length; i++) {
  const char = header[i];
  const code = header.charCodeAt(i);
  if (code < 32 || code > 126) {
    console.log(`Posição ${i}: '${char}' (código ${code})`);
  }
}

// Verificar se há caracteres especiais
console.log('\nCaracteres especiais no cabeçalho:');
const specialChars = header.match(/[^\x00-\x7F]/g);
if (specialChars) {
  console.log('Caracteres especiais encontrados:', specialChars);
} else {
  console.log('Nenhum caractere especial encontrado');
} 