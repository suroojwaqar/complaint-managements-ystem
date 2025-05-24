import Notification from '@/models/Notification';
import User from '@/models/User';
import Complaint from '@/models/Complaint';
import { sendEmail } from './email-utils';
import { sendWhatsAppMessage } from './whatsapp-utils';

interface NotificationParams {
  userId: string;
  complaintId: string;
  message: string;
  type: 'email' | 'whatsapp';
}

// Create notification and send it based on type
export async function createNotification(params: NotificationParams) {
  try {
    // Create notification in the database
    const notification = await Notification.create(params);
    
    // Send notification based on type
    if (params.type === 'email') {
      await sendEmailNotification(notification._id);
    } else if (params.type === 'whatsapp') {
      await sendWhatsAppNotification(notification._id);
    }
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

// Send email notification
async function sendEmailNotification(notificationId: string) {
  try {
    // Get notification with populated data
    const notification = await Notification.findById(notificationId)
      .populate('userId', 'name email')
      .populate({
        path: 'complaintId',
        select: 'title status',
        populate: {
          path: 'department',
          select: 'name'
        }
      });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    const user = notification.userId as any;
    const complaint = notification.complaintId as any;
    
    if (!user.email) {
      throw new Error('User email not found');
    }
    
    // Send email
    await sendEmail({
      to: user.email,
      subject: `Complaint Update: ${complaint.title}`,
      text: notification.message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Complaint Management System</h2>
          <p>Hello ${user.name},</p>
          <p>${notification.message}</p>
          <p>Complaint Details:</p>
          <ul>
            <li><strong>Title:</strong> ${complaint.title}</li>
            <li><strong>Status:</strong> ${complaint.status}</li>
            <li><strong>Department:</strong> ${complaint.department?.name || 'N/A'}</li>
          </ul>
          <p>Please log in to the system to view more details.</p>
        </div>
      `
    });
    
    // Update notification status
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'sent',
      sentAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    
    // Update notification status to failed
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'failed'
    });
    
    return false;
  }
}

// Send WhatsApp notification
async function sendWhatsAppNotification(notificationId: string) {
  try {
    // Get notification with populated data
    const notification = await Notification.findById(notificationId)
      .populate('userId', 'name phoneNumber') // Assuming phoneNumber is stored in the User model
      .populate('complaintId', 'title status');
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    const user = notification.userId as any;
    const complaint = notification.complaintId as any;
    
    if (!user.phoneNumber) {
      throw new Error('User phone number not found');
    }
    
    // Send WhatsApp message
    await sendWhatsAppMessage({
      to: user.phoneNumber,
      message: `${notification.message}\n\nComplaint: ${complaint.title}\nStatus: ${complaint.status}`
    });
    
    // Update notification status
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'sent',
      sentAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    
    // Update notification status to failed
    await Notification.findByIdAndUpdate(notificationId, {
      status: 'failed'
    });
    
    return false;
  }
}

// Retry failed notifications
export async function retryFailedNotifications() {
  try {
    const failedNotifications = await Notification.find({ status: 'failed' });
    
    for (const notification of failedNotifications) {
      if (notification.type === 'email') {
        await sendEmailNotification(notification._id);
      } else if (notification.type === 'whatsapp') {
        await sendWhatsAppNotification(notification._id);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to retry notifications:', error);
    return false;
  }
}
