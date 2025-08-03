const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

class NotificationService {
  constructor() {
    // Configuração do transporter (em produção, usar variáveis de ambiente)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendApprovalNotification(approval) {
    try {
      // Em ambiente de teste ou sem credenciais SMTP, simular envio
      if (process.env.NODE_ENV === 'test' || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.info('Notificação simulada (sem credenciais SMTP)', {
          approvalID: approval.id,
          approver: approval.approver,
          timestamp: new Date().toISOString()
        });
        return { messageId: 'simulated-message-id' };
      }

      const subject = `Nova solicitação de ${this.getTypeLabel(approval.type)}`;
      const html = this.generateApprovalEmail(approval);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@empresa.com',
        to: approval.approver,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Notificação de aprovação enviada', {
        approvalID: approval.id,
        approver: approval.approver,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      logger.error('Erro ao enviar notificação', {
        approvalID: approval.id,
        error: error.message
      });
      // Não lançar erro, apenas logar
      return { messageId: 'error-simulated' };
    }
  }

  async sendResponseNotification(approval) {
    try {
      const subject = `Sua solicitação foi ${approval.status === 'approved' ? 'aprovada' : 'rejeitada'}`;
      const html = this.generateResponseEmail(approval);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@empresa.com',
        to: approval.requester,
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Notificação de resposta enviada', {
        approvalID: approval.id,
        requester: approval.requester,
        status: approval.status,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      logger.error('Erro ao enviar notificação de resposta', {
        approvalID: approval.id,
        error: error.message
      });
      throw error;
    }
  }

  getTypeLabel(type) {
    const labels = {
      purchase: 'Compra',
      reimbursement: 'Reembolso',
      vacation: 'Férias'
    };
    return labels[type] || type;
  }

  generateApprovalEmail(approval) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nova Solicitação de ${this.getTypeLabel(approval.type)}</h2>
        <p><strong>Solicitante:</strong> ${approval.requester}</p>
        ${approval.amount ? `<p><strong>Valor:</strong> R$ ${approval.amount.toFixed(2)}</p>` : ''}
        ${approval.description ? `<p><strong>Descrição:</strong> ${approval.description}</p>` : ''}
        <p><strong>Data:</strong> ${new Date(approval.createdAt).toLocaleDateString('pt-BR')}</p>
        <hr>
        <p>Clique no link abaixo para aprovar ou rejeitar:</p>
        <a href="${process.env.APP_URL}/approval/${approval.id}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Ver Detalhes
        </a>
      </div>
    `;
  }

  generateResponseEmail(approval) {
    const statusText = approval.status === 'approved' ? 'aprovada' : 'rejeitada';
    const statusColor = approval.status === 'approved' ? '#28a745' : '#dc3545';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sua solicitação foi ${statusText}</h2>
        <p><strong>Tipo:</strong> ${this.getTypeLabel(approval.type)}</p>
        ${approval.amount ? `<p><strong>Valor:</strong> R$ ${approval.amount.toFixed(2)}</p>` : ''}
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText.toUpperCase()}</span></p>
        ${approval.response?.justification ? `<p><strong>Justificativa:</strong> ${approval.response.justification}</p>` : ''}
        <p><strong>Data da resposta:</strong> ${new Date(approval.response?.timestamp).toLocaleDateString('pt-BR')}</p>
      </div>
    `;
  }
}

module.exports = new NotificationService(); 