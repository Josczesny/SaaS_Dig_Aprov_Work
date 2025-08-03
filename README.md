# Sistema de Aprovações - Empresa

Sistema completo de aprovações empresariais com autenticação, banco de dados persistente, detecção de Tor e interface web moderna.

## 🚀 Funcionalidades

### ✅ Backend (API REST)
- **Autenticação JWT** com roles (admin, manager, approver, user)
- **Banco de dados SQLite** persistente
- **Sistema de aprovações** completo (criar, listar, responder)
- **Detecção e bloqueio de IPs Tor**
- **Logs de auditoria** estruturados
- **Rate limiting** e segurança
- **Validação robusta** de dados

### ✅ Frontend (Interface Web)
- **Interface moderna** com Bootstrap 5
- **Dashboard responsivo** com estatísticas
- **Modais interativos** para criação e resposta de aprovações
- **Notificações toast** em tempo real
- **Logs de auditoria** visíveis para admins
- **Design responsivo** para mobile

## 🛠️ Tecnologias

### Backend
- **Node.js** + Express
- **SQLite** (better-sqlite3)
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **Joi** para validação
- **Winston** para logs
- **Axios** para requisições HTTP
- **Node-cache** para cache

### Frontend
- **HTML5** + **CSS3** + **JavaScript**
- **Bootstrap 5** para UI
- **Font Awesome** para ícones
- **Fetch API** para requisições

## 📦 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd SaaS_Dig_Aprov_Work
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

4. **Inicie o servidor**
```bash
npm run dev
```

5. **Acesse a aplicação**
```
http://localhost:3000
```

## 👥 Usuários de Teste

| Email | Senha | Role | Descrição |
|-------|-------|------|-----------|
| admin@empresa.com | Admin123! | admin | Administrador completo |
| maria.santos@empresa.com | Manager123! | manager | Gerente com aprovações |
| joao.silva@empresa.com | User123! | user | Usuário comum |
| ana.rodrigues@empresa.com | Approver123! | approver | Aprovador |

## 🔧 Estrutura do Projeto

```
SaaS_Dig_Aprov_Work/
├── src/
│   ├── routes/           # Rotas da API
│   ├── services/         # Lógica de negócio
│   ├── middleware/       # Middlewares
│   ├── models/          # Modelos de dados
│   ├── utils/           # Utilitários
│   └── scripts/         # Scripts de manutenção
├── public/              # Frontend
│   ├── index.html       # Página principal
│   ├── styles.css       # Estilos
│   └── app.js          # JavaScript
├── data/               # Banco SQLite
├── tests/              # Testes automatizados
└── .cursor/rules/      # Regras do projeto
```

## 🎯 Fluxo de Uso

### 1. Login
- Acesse `http://localhost:3000`
- Use um dos usuários de teste
- Sistema valida credenciais e gera JWT

### 2. Dashboard
- **Cards de estatísticas**: Pendentes, Aprovadas, Rejeitadas, Total
- **Tabela de aprovações**: Lista todas as aprovações
- **Botões de ação**: Nova aprovação, Atualizar, Logs (admin)

### 3. Criar Aprovação
- Clique em "Nova Aprovação"
- Preencha: Tipo, Valor (se aplicável), Aprovador, Descrição
- Sistema valida dados e cria aprovação

### 4. Responder Aprovação
- Clique em "Responder" na aprovação pendente
- Escolha: Aprovar ou Rejeitar
- Adicione justificativa obrigatória
- Sistema registra ação e atualiza status

### 5. Auditoria (Admin)
- Botão "Logs de Auditoria" disponível para admins
- Visualiza todas as ações realizadas
- Histórico completo de decisões

## 🔒 Segurança

### Autenticação
- **JWT tokens** com expiração
- **Hash bcrypt** para senhas
- **Rate limiting** por IP
- **Bloqueio por tentativas** excessivas

### Validação
- **Joi schemas** para validação de dados
- **Prevenção XSS** e SQL injection
- **Sanitização** de inputs

### Detecção Tor
- **Múltiplas fontes** de IPs Tor
- **Cache inteligente** de listas
- **Padrões suspeitos** detectados
- **Fail-safe** em caso de erro

## 📊 Banco de Dados

### Tabelas
- **users**: Usuários e autenticação
- **approvals**: Aprovações e status
- **audit_logs**: Logs de auditoria
- **blocked_ips**: IPs bloqueados (Tor)

### Índices
- Performance otimizada para consultas
- Índices em campos críticos
- WAL mode para concorrência

## 🧪 Testes

### Executar todos os testes
```bash
npm test
```

### Testes específicos
```bash
npm test -- tests/auth.test.js
npm test -- tests/approval.test.js
npm test -- tests/tor-detection.test.js
```

### Cobertura de testes
- ✅ Autenticação completa
- ✅ Fluxo de aprovações
- ✅ Detecção de Tor
- ✅ Validações de segurança
- ✅ Cenários de erro
- ✅ Testes de integração

## 🚀 Deploy

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Variáveis de Ambiente
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=sua_chave_secreta
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=seu_email
SMTP_PASS=sua_senha
```

## 📈 Monitoramento

### Logs
- **Winston** para logs estruturados
- **Timestamps ISO-8601**
- **Níveis de log**: error, warn, info, debug

### Métricas
- **Estatísticas de aprovações**
- **Logs de auditoria**
- **Detecção de Tor**
- **Performance do banco**

## 🔧 Manutenção

### Scripts disponíveis
```bash
# Migrar usuários padrão
node src/scripts/migrate-users.js

# Corrigir senhas
node src/scripts/fix-passwords.js

# Limpar bloqueios
node src/scripts/clear-locks.js
```

### Backup do banco
```bash
# Backup automático
node -e "require('./src/services/database').backup()"
```

## 🎉 Status do Projeto

### ✅ Implementado
- [x] Backend completo com API REST
- [x] Autenticação JWT robusta
- [x] Banco de dados SQLite persistente
- [x] Sistema de aprovações completo
- [x] Detecção e bloqueio de Tor
- [x] Logs de auditoria
- [x] Frontend moderno e responsivo
- [x] Testes automatizados
- [x] Validações de segurança
- [x] Rate limiting
- [x] Interface intuitiva

### 🚀 Pronto para Produção
O sistema está **100% funcional** e pronto para uso em ambiente de produção com:
- ✅ Segurança implementada
- ✅ Performance otimizada
- ✅ Interface moderna
- ✅ Testes completos
- ✅ Documentação detalhada

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Consulte a documentação
3. Execute os testes para validar
4. Verifique as configurações de ambiente

---

**Sistema de Aprovações - Versão 1.0**  
*Desenvolvido com Node.js, Express, SQLite e Bootstrap* 