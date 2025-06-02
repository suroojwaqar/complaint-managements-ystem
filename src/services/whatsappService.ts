import { User } from '@/types/auth';
import { getEnv } from '@/lib/env';

interface WhatsAppMessagePayload {
  chatId: string;
  message: string;
  quotedMessageId?: string;
}

interface ComplaintNotificationData {
  complaint: any;
  user: User;
  eventType: 'created' | 'assigned' | 'status_changed' | 'comment_added' | 'reassigned';
  details?: {
    oldStatus?: string;
    newStatus?: string;
    oldAssignee?: string;
    newAssignee?: string;
    department?: string;
    comment?: string;
    commentAuthor?: string;
  };
}

class WhatsAppService {
  private apiUrl: string;
  private instanceId: string;
  private apiKey: string;
  private defaultCountryCode: string;

  constructor() {
    // FIXED: Use getEnv() instead of direct process.env access
    const env = getEnv();
    this.apiUrl = env.WAAPI_BASE_URL || 'https://waapi.app/api/v1';
    this.instanceId = env.WAAPI_INSTANCE_ID || '';
    this.apiKey = env.WAAPI_API_KEY || '';
    this.defaultCountryCode = env.DEFAULT_COUNTRY_CODE || '92';

    if (!this.instanceId || !this.apiKey) {
      console.warn('WhatsApp API credentials not configured. Set WAAPI_INSTANCE_ID and WAAPI_API_KEY environment variables.');
    }
  }

  private isConfigured(): boolean {
    return !!(this.instanceId && this.apiKey);
  }

  private async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('WhatsApp service not configured, skipping message send');
      return false;
    }

    try {
      const payload = {
        chatId: chatId,
        message: message
      };

      const fullUrl = `${this.apiUrl}/instances/${this.instanceId}/client/action/send-message`;

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('WhatsApp API Error:', response.status);
        return false;
      }

      console.log('✅ WhatsApp message sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return false;
    }
  }

  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    let cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return '';
    
    if (cleaned.startsWith('0')) {
      cleaned = this.defaultCountryCode + cleaned.slice(1);
    } else if (cleaned.length === 10 && !this.looksLikeInternationalNumber(cleaned)) {
      cleaned = this.defaultCountryCode + cleaned;
    }
    
    return cleaned + '@c.us';
  }
  
  private looksLikeInternationalNumber(number: string): boolean {
    const patterns = [
      /^1[0-9]/,     // US/Canada
      /^7[0-9]/,     // Russia/Kazakhstan
      /^2[0-9]/,     // Africa/some Europe
      /^3[0-9]/,     // Europe
      /^4[0-9]/,     // Europe
      /^5[0-9]/,     // South America
      /^6[0-9]/,     // Southeast Asia/Oceania
      /^8[0-9]/,     // East Asia
      /^9[0-5]/      // Asia/Middle East
    ];
    
    return patterns.some(pattern => pattern.test(number));
  }

  private generateNotificationMessage(data: ComplaintNotificationData): string {
    const { complaint, user, eventType, details } = data;
    
    const env = getEnv();
    const complaintUrl = `${env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/complaints/${complaint._id}`;
    const shortId = complaint._id.toString().slice(-6);

    const emojis = {
      created: '🆕',
      assigned: '👤',
      status_changed: '📋',
      comment_added: '💬',
      reassigned: '🔄'
    };

    const emoji = emojis[eventType] || '📢';

    switch (eventType) {
      case 'created':
        return `${emoji} *New Complaint Created*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Client:* ${complaint.clientId?.name || 'Unknown'}
*Department:* ${complaint.department?.name || 'Unknown'}
*Status:* ${complaint.status}
*Created by:* ${user.name}

*Description:*
${complaint.description}

View details: ${complaintUrl}`;

      case 'assigned':
        return `${emoji} *Complaint Assigned*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Assigned to:* ${details?.newAssignee || 'Unknown'}
*Department:* ${details?.department || complaint.department?.name}
*Status:* ${complaint.status}
*Assigned by:* ${user.name}

View details: ${complaintUrl}`;

      case 'status_changed':
        return `${emoji} *Complaint Status Updated*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Status:* ${details?.oldStatus} → *${details?.newStatus}*
*Updated by:* ${user.name}
*Assigned to:* ${complaint.currentAssigneeId?.name || 'Unknown'}

View details: ${complaintUrl}`;

      case 'comment_added':
        return `${emoji} *New Comment Added*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Comment by:* ${details?.commentAuthor || user.name}
*Status:* ${complaint.status}

*Comment:*
${details?.comment || 'No content'}

View details: ${complaintUrl}`;

      case 'reassigned':
        return `${emoji} *Complaint Reassigned*

*ID:* #${shortId}
*Title:* ${complaint.title}
*From:* ${details?.oldAssignee || 'Unknown'}
*To:* ${details?.newAssignee || 'Unknown'}
*Department:* ${details?.department || complaint.department?.name}
*Reassigned by:* ${user.name}

View details: ${complaintUrl}`;

      default:
        return `📢 *Complaint Update*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Status:* ${complaint.status}
*Updated by:* ${user.name}

View details: ${complaintUrl}`;
    }
  }

  async sendComplaintNotification(data: ComplaintNotificationData, recipients: string[]): Promise<void> {
    if (!this.isConfigured()) {
      console.log('❌ WhatsApp service not configured, skipping notifications');
      return;
    }

    const message = this.generateNotificationMessage(data);
    const validRecipients = recipients.filter(phone => phone && phone.trim());

    if (validRecipients.length === 0) {
      console.log('⚠️  No valid phone numbers provided for WhatsApp notification');
      return;
    }

    for (let i = 0; i < validRecipients.length; i++) {
      const phone = validRecipients[i];
      const chatId = this.formatPhoneNumber(phone);
      
      try {
        await this.sendMessage(chatId, message);
      } catch (error) {
        console.log(`❌ Message ${i + 1}/${validRecipients.length} error:`, error);
      }

      // Add delay between messages to avoid rate limiting
      if (i < validRecipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async notifyComplaintCreated(complaint: any, creator: User, assigneePhone?: string, adminPhones: string[] = []): Promise<void> {
    const recipients = [...adminPhones];
    if (assigneePhone) recipients.push(assigneePhone);

    await this.sendComplaintNotification({
      complaint,
      user: creator,
      eventType: 'created'
    }, recipients);
  }

  async notifyComplaintAssigned(
    complaint: any, 
    assigner: User, 
    oldAssignee?: string, 
    newAssignee?: string,
    recipientPhones: string[] = []
  ): Promise<void> {
    await this.sendComplaintNotification({
      complaint,
      user: assigner,
      eventType: oldAssignee ? 'reassigned' : 'assigned',
      details: {
        oldAssignee,
        newAssignee,
        department: complaint.department?.name
      }
    }, recipientPhones);
  }

  async notifyStatusChanged(
    complaint: any, 
    updater: User, 
    oldStatus: string, 
    newStatus: string,
    recipientPhones: string[] = []
  ): Promise<void> {
    await this.sendComplaintNotification({
      complaint,
      user: updater,
      eventType: 'status_changed',
      details: {
        oldStatus,
        newStatus
      }
    }, recipientPhones);
  }

  async notifyCommentAdded(
    complaint: any, 
    commentAuthor: User, 
    comment: string,
    recipientPhones: string[] = []
  ): Promise<void> {
    await this.sendComplaintNotification({
      complaint,
      user: commentAuthor,
      eventType: 'comment_added',
      details: {
        comment: comment.length > 200 ? comment.substring(0, 200) + '...' : comment,
        commentAuthor: commentAuthor.name
      }
    }, recipientPhones);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'WhatsApp API not configured. Please set WAAPI_INSTANCE_ID and WAAPI_API_KEY environment variables.'
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/instances/${this.instanceId}/client/action/is-connected`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          message: `WhatsApp instance is ${result.connected ? 'connected' : 'disconnected'}`
        };
      } else {
        return {
          success: false,
          message: `API Error: ${response.status} ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error}`
      };
    }
  }
}

export default new WhatsAppService();