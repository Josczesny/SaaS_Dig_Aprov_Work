const axios = require('axios');
const NodeCache = require('node-cache');
const { logger } = require('../utils/logger');

class TorDetectionService {
  constructor() {
    // Cache para IPs Tor (1 hora)
    this.torCache = new NodeCache({ stdTTL: 3600 });
    
    // Cache para IPs verificados (30 minutos)
    this.verifiedCache = new NodeCache({ stdTTL: 1800 });
    
    // Lista de IPs Tor conhecidos (atualizada periodicamente)
    this.torExitNodes = new Set();
    
    // Configurações
    this.updateInterval = 30 * 60 * 1000; // 30 minutos
    this.maxRetries = 3;
    this.timeout = 5000; // 5 segundos
    
    // Inicializar
    this.initialize();
  }

  async initialize() {
    try {
      await this.updateTorExitNodes();
      
      // Atualizar lista periodicamente
      setInterval(() => {
        this.updateTorExitNodes();
      }, this.updateInterval);
      
      logger.info('Serviço de detecção Tor inicializado', {
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erro ao inicializar serviço Tor', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async updateTorExitNodes() {
    try {
             // Múltiplas fontes para detecção de Tor
       const sources = [
         'https://check.torproject.org/exit-addresses',
         'https://raw.githubusercontent.com/SecOps-Institute/Tor-IP-Addresses/master/tor-exit-nodes.lst'
       ];

      const newExitNodes = new Set();

      for (const source of sources) {
        try {
          const response = await axios.get(source, {
            timeout: this.timeout,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; TorDetection/1.0)'
            }
          });

          if (response.status === 200) {
            const lines = response.data.split('\n');
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              
              // Padrões comuns de IPs Tor
              if (this.isValidIP(trimmedLine)) {
                newExitNodes.add(trimmedLine);
              } else if (trimmedLine.startsWith('ExitAddress')) {
                // Formato: ExitAddress 1.2.3.4
                const ip = trimmedLine.split(' ')[1];
                if (this.isValidIP(ip)) {
                  newExitNodes.add(ip);
                }
              }
            }
          }
        } catch (sourceError) {
          logger.warn('Erro ao buscar fonte Tor', {
            source,
            error: sourceError.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Atualizar lista
      this.torExitNodes = newExitNodes;
      
      logger.info('Lista de nós Tor atualizada', {
        count: this.torExitNodes.size,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Erro ao atualizar nós Tor', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    
    // Regex para validar IPv4
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  }

  async isTorExitNode(ip) {
    if (!ip || !this.isValidIP(ip)) {
      return false;
    }

    // Verificar cache primeiro
    const cachedResult = this.verifiedCache.get(ip);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    // Verificar lista local
    if (this.torExitNodes.has(ip)) {
      this.verifiedCache.set(ip, true);
      return true;
    }

    // Verificação externa (fallback)
    try {
      const isTor = await this.checkExternalTorService(ip);
      this.verifiedCache.set(ip, isTor);
      return isTor;
    } catch (error) {
      logger.warn('Erro na verificação externa Tor', {
        ip,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Em caso de erro, assumir que não é Tor
      this.verifiedCache.set(ip, false);
      return false;
    }
  }

  async checkExternalTorService(ip) {
    try {
      // Usar serviço de verificação Tor
      const response = await axios.get(`https://check.torproject.org/exit-addresses`, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TorDetection/1.0)'
        }
      });

      if (response.status === 200) {
        const content = response.data;
        return content.includes(ip);
      }

      return false;
    } catch (error) {
      throw new Error(`Falha na verificação externa: ${error.message}`);
    }
  }

  // Detecção de padrões suspeitos de Tor
  detectTorPatterns(req) {
    const suspiciousPatterns = [
      // User-Agent suspeito (mais específico)
      req.headers['user-agent']?.toLowerCase().includes('tor browser'),
      req.headers['user-agent']?.toLowerCase().includes('anonymous browser'),
      req.headers['user-agent']?.toLowerCase().includes('privacy browser'),
      
      // Headers de proxy suspeitos (mais específicos)
      req.headers['x-forwarded-for']?.includes('127.0.0.1') && req.headers['x-forwarded-for']?.split(',').length > 1,
      req.headers['x-real-ip']?.includes('127.0.0.1'),
      req.headers['cf-connecting-ip']?.includes('127.0.0.1'),
      
      // Headers ausentes (apenas se múltiplos estiverem ausentes)
      (!req.headers['accept-language'] && !req.headers['accept-encoding']),
      
      // Porta de origem suspeita
      req.connection?.remotePort === 9050,
      req.connection?.remotePort === 9150,
      
      // Headers específicos de Tor
      req.headers['x-tor-ip'],
      req.headers['x-tor-exit-node']
    ];

    // Contar quantos padrões suspeitos foram detectados
    const suspiciousCount = suspiciousPatterns.filter(pattern => pattern === true).length;
    
    // Considerar suspeito se pelo menos 3 padrões foram detectados (mais rigoroso)
    return suspiciousCount >= 3;
  }

  // Verificação completa de Tor
  async checkTorAccess(req) {
    const clientIP = this.getClientIP(req);
    
    if (!clientIP) {
      return {
        isTor: false,
        reason: 'IP não detectado',
        ip: null
      };
    }

    // Verificar padrões suspeitos primeiro
    const suspiciousPatterns = this.detectTorPatterns(req);
    
    if (suspiciousPatterns) {
      logger.warn('Padrões suspeitos de Tor detectados', {
        ip: clientIP,
        userAgent: req.headers['user-agent'],
        headers: req.headers,
        timestamp: new Date().toISOString()
      });
    }

    // Verificar se é nó de saída Tor
    const isTorExitNode = await this.isTorExitNode(clientIP);
    
    if (isTorExitNode) {
      logger.warn('Acesso bloqueado - IP Tor detectado', {
        ip: clientIP,
        userAgent: req.headers['user-agent'],
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }

    // Lógica de detecção mais equilibrada
    const suspiciousCount = suspiciousPatterns ? 1 : 0; // Contador simplificado
    const isTor = isTorExitNode || 
                  (process.env.NODE_ENV === 'production' && suspiciousPatterns);

    return {
      isTor,
      reason: isTorExitNode ? 'Nó de saída Tor' : (suspiciousPatterns ? 'Padrões suspeitos' : 'Limpo'),
      ip: clientIP,
      suspiciousPatterns,
      suspiciousCount
    };
  }

  getClientIP(req) {
    // Verificar headers de proxy
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const cfConnectingIP = req.headers['cf-connecting-ip'];
    
    if (forwardedFor) {
      // Pegar o primeiro IP da lista
      return forwardedFor.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    // IP direto
    return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
  }

  // Estatísticas de detecção
  getStats() {
    return {
      torExitNodesCount: this.torExitNodes.size,
      verifiedCacheSize: this.verifiedCache.keys().length,
      lastUpdate: new Date().toISOString()
    };
  }

  // Limpar cache (útil para testes)
  clearCache() {
    this.verifiedCache.flushAll();
    this.torCache.flushAll();
  }
}

// Instância singleton
const torDetectionService = new TorDetectionService();

module.exports = torDetectionService; 