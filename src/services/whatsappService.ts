import { User } from '@/types/auth';

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
    this.apiUrl = process.env.WAAPI_BASE_URL || 'https://waapi.app/api/v1';
    this.instanceId = process.env.WAAPI_INSTANCE_ID || '';
    this.apiKey = process.env.WAAPI_API_KEY || '';
    this.defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '92'; // Default to Pakistan, configurable

    if (!this.instanceId || !this.apiKey) {
      console.warn('WhatsApp API credentials not configured. Set WAAPI_INSTANCE_ID and WAAPI_API_KEY environment variables.');
    }
  }

  private isConfigured(): boolean {
    return !!(this.instanceId && this.apiKey);
  }

  /**
   * Send WhatsApp message via WAAPI
   */
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

      console.log('=== SENDING WHATSAPP MESSAGE ===');
      console.log('ChatId:', chatId);
      console.log('Message length:', message.length);
      console.log('Instance ID:', this.instanceId);
      console.log('API Key (first 8 chars):', this.apiKey.slice(0, 8) + '...');
      
      const fullUrl = `${this.apiUrl}/instances/${this.instanceId}/client/action/send-message`;
      console.log('Full URL:', fullUrl);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status, response.statusText);
      
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = { raw: responseText };
      }

      console.log('Response body:', result);

      if (!response.ok) {
        console.error('WhatsApp API Error:', response.status, result);
        return false;
      }

      console.log('✅ WhatsApp message sent successfully:', result);
      return true;

    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Format phone number for WhatsApp - More flexible approach
   */
  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If the number is empty after cleaning, return empty
    if (!cleaned) return '';
    
    console.log(`Formatting phone: "${phone}" -> cleaned: "${cleaned}"`);
    
    // If number starts with 0, it's likely a local number
    if (cleaned.startsWith('0')) {
      cleaned = this.defaultCountryCode + cleaned.slice(1);
      console.log(`Detected local number (starts with 0), added country code: ${cleaned}`);
    }
    // If number is exactly 10 digits and doesn't appear to have country code
    else if (cleaned.length === 10 && !this.looksLikeInternationalNumber(cleaned)) {
      cleaned = this.defaultCountryCode + cleaned;
      console.log(`Detected 10-digit local number, added country code: ${cleaned}`);
    }
    // If number is 11 digits and doesn't start with 1 (US) or other single-digit codes
    else if (cleaned.length === 11 && !cleaned.startsWith('1') && !this.looksLikeInternationalNumber(cleaned)) {
      // Might be local number with extra digit, try removing first digit and adding country code
      if (cleaned.startsWith('0')) {
        cleaned = this.defaultCountryCode + cleaned.slice(1);
        console.log(`Detected 11-digit number starting with 0, reformatted: ${cleaned}`);
      } else {
        console.log(`11-digit number doesn't start with 0, using as-is: ${cleaned}`);
      }
    }
    else {
      console.log(`Number appears to be international or correct format, using as-is: ${cleaned}`);
    }
    
    const formattedNumber = cleaned + '@c.us';
    console.log(`Final WhatsApp format: ${phone} → ${formattedNumber}`);
    return formattedNumber;
  }
  
  /**
   * Check if number looks like it already has an international country code
   */
  private looksLikeInternationalNumber(number: string): boolean {
    // Common country code patterns
    const patterns = [
      /^1[0-9]/,     // US/Canada (1xxx)
      /^7[0-9]/,     // Russia/Kazakhstan (7xxx)
      /^2[0-9]/,     // Africa/some Europe
      /^3[0-9]/,     // Europe
      /^4[0-9]/,     // Europe
      /^5[0-9]/,     // South America
      /^6[0-9]/,     // Southeast Asia/Oceania
      /^8[0-9]/,     // East Asia
      /^9[0-5]/      // Asia/Middle East (including 92 for Pakistan)
    ];
    
    return patterns.some(pattern => pattern.test(number));
  }

  /**
   * Generate complaint notification message
   */
  private generateNotificationMessage(data: ComplaintNotificationData): string {
    const { complaint, user, eventType, details } = data;
    
    const complaintUrl = `${process.env.NEXTAUTH_URL}/admin/complaints/${complaint._id}`;
    const shortId = complaint._id.toString().slice(-6);

    let message = '';
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
        message = `${emoji} *New Complaint Created*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Client:* ${complaint.clientId?.name || 'Unknown'}
*Department:* ${complaint.department?.name || 'Unknown'}
*Status:* ${complaint.status}
*Created by:* ${user.name}

*Description:*
${complaint.description}

View details: ${complaintUrl}`;
        break;

      case 'assigned':
        message = `${emoji} *Complaint Assigned*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Assigned to:* ${details?.newAssignee || 'Unknown'}
*Department:* ${details?.department || complaint.department?.name}
*Status:* ${complaint.status}
*Assigned by:* ${user.name}

View details: ${complaintUrl}`;
        break;

      case 'status_changed':
        message = `${emoji} *Complaint Status Updated*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Status:* ${details?.oldStatus} → *${details?.newStatus}*
*Updated by:* ${user.name}
*Assigned to:* ${complaint.currentAssigneeId?.name || 'Unknown'}

View details: ${complaintUrl}`;
        break;

      case 'comment_added':
        message = `${emoji} *New Comment Added*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Comment by:* ${details?.commentAuthor || user.name}
*Status:* ${complaint.status}

*Comment:*
${details?.comment || 'No content'}

View details: ${complaintUrl}`;
        break;

      case 'reassigned':
        message = `${emoji} *Complaint Reassigned*

*ID:* #${shortId}
*Title:* ${complaint.title}
*From:* ${details?.oldAssignee || 'Unknown'}
*To:* ${details?.newAssignee || 'Unknown'}
*Department:* ${details?.department || complaint.department?.name}
*Reassigned by:* ${user.name}

View details: ${complaintUrl}`;
        break;

      default:
        message = `📢 *Complaint Update*

*ID:* #${shortId}
*Title:* ${complaint.title}
*Status:* ${complaint.status}
*Updated by:* ${user.name}

View details: ${complaintUrl}`;
    }

    return message;
  }

  /**
   * Send notification to multiple users
   */
  async sendComplaintNotification(data: ComplaintNotificationData, recipients: string[]): Promise<void> {
    console.log('\n=== WHATSAPP SERVICE NOTIFICATION START ===');
    console.log('whatsappService.sendComplaintNotification called');
    console.log('Event type:', data.eventType);
    console.log('User:', data.user.name, '(', data.user.role, ')');
    console.log('Recipients:', recipients);
    console.log('Recipients count:', recipients.length);
    console.log('Using default country code:', this.defaultCountryCode);
    
    if (!this.isConfigured()) {
      console.log('❌ WhatsApp service not configured, skipping notifications');
      console.log('WAAPI_INSTANCE_ID:', this.instanceId || 'NOT SET');
      console.log('WAAPI_API_KEY:', this.apiKey ? 'SET' : 'NOT SET');
      console.log('=== WHATSAPP SERVICE NOTIFICATION END ===\n');
      return;
    }

    const message = this.generateNotificationMessage(data);
    console.log('Generated message preview:', message.substring(0, 100) + '...');
    
    const validRecipients = recipients.filter(phone => phone && phone.trim());
    console.log('Valid recipients after filtering:', validRecipients);
    console.log('Valid recipients count:', validRecipients.length);

    if (validRecipients.length === 0) {
      console.log('⚠️  No valid phone numbers provided for WhatsApp notification');
      console.log('=== WHATSAPP SERVICE NOTIFICATION END ===\n');
      return;
    }

    console.log(`Sending WhatsApp notifications to ${validRecipients.length} recipients...`);

    // Send notifications with delay to avoid rate limiting
    for (let i = 0; i < validRecipients.length; i++) {
      const phone = validRecipients[i];
      const chatId = this.formatPhoneNumber(phone);
      
      console.log(`Sending ${i + 1}/${validRecipients.length} to ${phone} -> ${chatId}`);

      try {
        const success = await this.sendMessage(chatId, message);
        if (success) {
          console.log(`✅ Message ${i + 1}/${validRecipients.length} sent successfully`);
        } else {
          console.log(`❌ Message ${i + 1}/${validRecipients.length} failed`);
        }
      } catch (error) {
        console.log(`❌ Message ${i + 1}/${validRecipients.length} error:`, error);
      }

      // Add delay between messages to avoid rate limiting (1 second)
      if (i < validRecipients.length - 1) {
        console.log('Waiting 1 second before next message...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('=== WHATSAPP SERVICE NOTIFICATION END ===\n');
  }

  /**
   * Send notification when new complaint is created
   */
  async notifyComplaintCreated(complaint: any, creator: User, assigneePhone?: string, adminPhones: string[] = []): Promise<void> {
    const recipients = [...adminPhones];
    if (assigneePhone) recipients.push(assigneePhone);

    await this.sendComplaintNotification({
      complaint,
      user: creator,
      eventType: 'created'
    }, recipients);
  }

  /**
   * Send notification when complaint is assigned/reassigned
   */
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

  /**
   * Send notification when complaint status changes
   */
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

  /**
   * Send notification when comment is added
   */
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

  /**
   * Test WhatsApp API connection
   */
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