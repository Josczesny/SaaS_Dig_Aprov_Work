const Database = require('better-sqlite3');
const path = require('path');
const { logger } = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../../data/app.db');
    this.initialize();
  }

  initialize() {
    try {
      // Criar diretório data se não existir
      const fs = require('fs');
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Inicializar banco de dados
      this.db = new Database(this.dbPath);
      
      // Configurar WAL mode para melhor performance
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('temp_store = memory');

      // Criar tabelas
      this.createTables();
      
      logger.info('Banco de dados inicializado', {
        path: this.dbPath,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Erro ao inicializar banco de dados', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  createTables() {
    // Tabela de usuários
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        department TEXT,
        isActive BOOLEAN DEFAULT 1,
        createdAt TEXT NOT NULL,
        lastLogin TEXT,
        failedLoginAttempts INTEGER DEFAULT 0,
        lockedUntil TEXT
      )
    `);

    // Tabela de aprovações
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL,
        requester TEXT NOT NULL,
        approver TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        responseAt TEXT,
        responseBy TEXT,
        action TEXT,
        justification TEXT
      )
    `);

    // Tabela de logs de auditoria
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        approver TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        comment TEXT,
        approvalId TEXT,
        metadata TEXT
      )
    `);

    // Tabela de IPs bloqueados (Tor)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        ip TEXT PRIMARY KEY,
        reason TEXT NOT NULL,
        blockedAt TEXT NOT NULL,
        expiresAt TEXT,
        isActive BOOLEAN DEFAULT 1
      )
    `);

    // Índices para performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
      CREATE INDEX IF NOT EXISTS idx_approvals_requester ON approvals(requester);
      CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approver);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_approver ON audit_logs(approver);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    logger.info('Tabelas criadas com sucesso', {
      timestamp: new Date().toISOString()
    });
  }

  // Métodos para usuários
  createUser(userData) {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password, name, role, department, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      userData.id,
      userData.email,
      userData.password,
      userData.name,
      userData.role,
      userData.department,
      userData.isActive ? 1 : 0,
      userData.createdAt
    );
  }

  findUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  findUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  findAllUsers() {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY createdAt DESC');
    return stmt.all();
  }

  updateUser(id, updates) {
    try {
      // Filtrar campos que não devem ser atualizados diretamente
      const { id: _, ...updateFields } = updates;
      
      // Converter valores para tipos compatíveis com SQLite
      const sanitizedUpdates = {};
      const values = [];
      
      for (const [key, value] of Object.entries(updateFields)) {
        if (value === undefined) {
          continue; // Pular campos undefined
        }
        
        let sqlValue;
        if (value === null) {
          sqlValue = null;
        } else if (typeof value === 'boolean') {
          sqlValue = value ? 1 : 0;
        } else if (typeof value === 'number') {
          sqlValue = value;
        } else if (typeof value === 'string') {
          sqlValue = value;
        } else {
          // Para outros tipos, converter para string
          sqlValue = String(value);
        }
        
        sanitizedUpdates[key] = sqlValue;
        values.push(sqlValue);
      }
      
      if (Object.keys(sanitizedUpdates).length === 0) {
        logger.warn('Nenhum campo válido para atualizar', { id, updates });
        return { changes: 0 };
      }
      
      const fields = Object.keys(sanitizedUpdates).map(key => `${key} = ?`).join(', ');
      values.push(id);
      
      const stmt = this.db.prepare(`UPDATE users SET ${fields} WHERE id = ?`);
      return stmt.run(...values);
    } catch (error) {
      logger.error('Erro ao atualizar usuário no banco', {
        error: error.message,
        id,
        updates,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  deleteUser(id) {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id);
  }

  // Métodos para aprovações
  createApproval(approvalData) {
    const stmt = this.db.prepare(`
      INSERT INTO approvals (id, type, amount, requester, approver, description, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      approvalData.id,
      approvalData.type,
      approvalData.amount,
      approvalData.requester,
      approvalData.approver,
      approvalData.description,
      approvalData.status,
      approvalData.createdAt
    );
  }

  findApprovalById(id) {
    const stmt = this.db.prepare('SELECT * FROM approvals WHERE id = ?');
    return stmt.get(id);
  }

  findPendingApprovals(approverId = null) {
    let sql = 'SELECT * FROM approvals WHERE status = ?';
    let params = ['pending'];
    
    if (approverId) {
      sql += ' AND approver = ?';
      params.push(approverId);
    }
    
    sql += ' ORDER BY createdAt DESC';
    const stmt = this.db.prepare(sql);
    return stmt.all(params);
  }

  updateApproval(id, updates) {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);
    
    const stmt = this.db.prepare(`UPDATE approvals SET ${fields} WHERE id = ?`);
    return stmt.run(...values);
  }

  deleteApproval(id) {
    const stmt = this.db.prepare('DELETE FROM approvals WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error('Aprovação não encontrada');
    }
    
    return result;
  }

  // Métodos para logs de auditoria
  createAuditLog(auditData) {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, approver, action, timestamp, comment, approvalId, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    return stmt.run(
      auditData.id,
      auditData.approver,
      auditData.action,
      auditData.timestamp,
      auditData.comment,
      auditData.approvalId,
      auditData.metadata ? JSON.stringify(auditData.metadata) : null
    );
  }

  findAuditLogs(filters = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    let params = [];
    
    if (filters.startDate) {
      sql += ' AND timestamp >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      sql += ' AND timestamp <= ?';
      params.push(filters.endDate);
    }
    
    if (filters.approverId) {
      sql += ' AND approver = ?';
      params.push(filters.approverId);
    }
    
    if (filters.action) {
      sql += ' AND action = ?';
      params.push(filters.action);
    }
    
    sql += ' ORDER BY timestamp DESC';
    const stmt = this.db.prepare(sql);
    const logs = stmt.all(params);
    
    // Debug para logs de exclusão
    logs.forEach((log, index) => {
      if (log.action === 'deleted') {
        console.log(`Log de exclusão ${index}:`, {
          id: log.id,
          approvalId: log.approvalId,
          metadata: log.metadata,
          metadataParsed: log.metadata ? JSON.parse(log.metadata) : null
        });
      }
    });
    
    return logs;
  }

  // Métodos para IPs bloqueados
  addBlockedIP(ip, reason, expiresAt = null) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO blocked_ips (ip, reason, blockedAt, expiresAt, isActive)
      VALUES (?, ?, ?, ?, 1)
    `);
    
    return stmt.run(ip, reason, new Date().toISOString(), expiresAt);
  }

  isIPBlocked(ip) {
    const stmt = this.db.prepare(`
      SELECT * FROM blocked_ips 
      WHERE ip = ? AND isActive = 1 
      AND (expiresAt IS NULL OR expiresAt > ?)
    `);
    
    return stmt.get(ip, new Date().toISOString());
  }

  removeBlockedIP(ip) {
    const stmt = this.db.prepare('UPDATE blocked_ips SET isActive = 0 WHERE ip = ?');
    return stmt.run(ip);
  }

  // Métodos de limpeza (para testes)
  clearAllData() {
    this.db.exec(`
      DELETE FROM users;
      DELETE FROM approvals;
      DELETE FROM audit_logs;
      DELETE FROM blocked_ips;
    `);
  }

  // Métodos de backup e manutenção
  backup() {
    const backupPath = this.dbPath.replace('.db', `_backup_${Date.now()}.db`);
    this.db.backup(backupPath);
    logger.info('Backup do banco criado', {
      backupPath,
      timestamp: new Date().toISOString()
    });
    return backupPath;
  }

  getStats() {
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const approvalCount = this.db.prepare('SELECT COUNT(*) as count FROM approvals').get().count;
    const pendingCount = this.db.prepare('SELECT COUNT(*) as count FROM approvals WHERE status = "pending"').get().count;
    const auditCount = this.db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
    const blockedCount = this.db.prepare('SELECT COUNT(*) as count FROM blocked_ips WHERE isActive = 1').get().count;

    return {
      users: userCount,
      approvals: approvalCount,
      pendingApprovals: pendingCount,
      auditLogs: auditCount,
      blockedIPs: blockedCount,
      lastUpdate: new Date().toISOString()
    };
  }

  // Fechar conexão
  close() {
    if (this.db) {
      this.db.close();
      logger.info('Conexão com banco de dados fechada', {
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Instância singleton
const databaseService = new DatabaseService();

// Graceful shutdown
process.on('SIGINT', () => {
  databaseService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  databaseService.close();
  process.exit(0);
});

module.exports = databaseService; 