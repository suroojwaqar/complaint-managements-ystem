import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Get phone numbers for WhatsApp notifications based on complaint events
 */
export class NotificationService {
  
  /**
   * Get admin phone numbers for notifications
   */
  static async getAdminPhones(): Promise<string[]> {
    try {
      console.log('NotificationService.getAdminPhones - START');
      await dbConnect();
      const admins = await User.find({ 
        role: 'admin', 
        isActive: true,
        phone: { $exists: true, $ne: null, $nin: ['', null] }
      }).select('phone name');
      
      console.log(`Found ${admins.length} admins with phones:`, admins.map(a => ({ name: a.name, phone: a.phone })));
      const phones = admins.map(admin => admin.phone).filter(phone => phone);
      console.log('Admin phones:', phones);
      console.log('NotificationService.getAdminPhones - END');
      return phones;
    } catch (error) {
      console.error('❌ Error fetching admin phones:', error);
      return [];
    }
  }

  /**
   * Get manager phone numbers for a specific department
   */
  static async getDepartmentManagerPhones(departmentId: string): Promise<string[]> {
    try {
      console.log('NotificationService.getDepartmentManagerPhones - START');
      console.log('Department ID:', departmentId);
      
      if (!departmentId) {
        console.log('No department ID provided');
        return [];
      }
      
      await dbConnect();
      const managers = await User.find({ 
        role: 'manager', 
        department: departmentId,
        isActive: true,
        phone: { $exists: true, $ne: null, $nin: ['', null] }
      }).select('phone name');
      
      console.log(`Found ${managers.length} managers with phones:`, managers.map(m => ({ name: m.name, phone: m.phone })));
      const phones = managers.map(manager => manager.phone).filter(phone => phone);
      console.log('Manager phones:', phones);
      console.log('NotificationService.getDepartmentManagerPhones - END');
      return phones;
    } catch (error) {
      console.error('❌ Error fetching manager phones:', error);
      return [];
    }
  }

  /**
   * Get phone number for a specific user
   */
  static async getUserPhone(userId: string): Promise<string | null> {
    try {
      console.log('NotificationService.getUserPhone - START');
      console.log('User ID:', userId);
      
      if (!userId) {
        console.log('No user ID provided');
        return null;
      }
      
      await dbConnect();
      const user = await User.findById(userId).select('phone name');
      
      if (user) {
        console.log(`Found user: ${user.name}, phone: ${user.phone || 'NO PHONE'}`);
      } else {
        console.log('User not found');
      }
      
      console.log('NotificationService.getUserPhone - END');
      return user?.phone || null;
    } catch (error) {
      console.error('❌ Error fetching user phone:', error);
      return null;
    }
  }

  /**
   * Get phone numbers for all relevant stakeholders for a complaint
   */
  static async getComplaintStakeholderPhones(complaint: any): Promise<{
    client: string | null;
    assignee: string | null;
    managers: string[];
    admins: string[];
  }> {
    try {
      console.log('NotificationService.getComplaintStakeholderPhones - START');
      console.log('Complaint data:', {
        _id: complaint._id,
        clientId: complaint.clientId?._id || complaint.clientId,
        currentAssigneeId: complaint.currentAssigneeId?._id || complaint.currentAssigneeId,
        department: complaint.department?._id || complaint.department
      });
      
      await dbConnect();
      console.log('Database connected');
      
      console.log('Getting stakeholder phones in parallel...');
      const [clientPhone, assigneePhone, managerPhones, adminPhones] = await Promise.all([
        this.getUserPhone(complaint.clientId?._id || complaint.clientId),
        this.getUserPhone(complaint.currentAssigneeId?._id || complaint.currentAssigneeId),
        this.getDepartmentManagerPhones(complaint.department?._id || complaint.department),
        this.getAdminPhones()
      ]);

      const result = {
        client: clientPhone,
        assignee: assigneePhone,
        managers: managerPhones,
        admins: adminPhones
      };
      
      console.log('Stakeholder phones result:', result);
      console.log('NotificationService.getComplaintStakeholderPhones - END');
      return result;
    } catch (error) {
      console.error('❌ Error fetching stakeholder phones:', error);
      return {
        client: null,
        assignee: null,
        managers: [],
        admins: []
      };
    }
  }

  /**
   * Get notification recipients based on event type and user role
   */
  static getNotificationRecipients(
    eventType: 'created' | 'assigned' | 'status_changed' | 'comment_added' | 'reassigned',
    userRole: string,
    stakeholderPhones: {
      client: string | null;
      assignee: string | null;
      managers: string[];
      admins: string[];
    }
  ): string[] {
    console.log('NotificationService.getNotificationRecipients - START');
    console.log('Event type:', eventType);
    console.log('User role:', userRole);
    console.log('Stakeholder phones:', stakeholderPhones);
    
    const recipients: string[] = [];
    const { client, assignee, managers, admins } = stakeholderPhones;

    switch (eventType) {
      case 'created':
        console.log('Processing created event...');
        if (assignee) recipients.push(assignee);
        recipients.push(...managers);
        recipients.push(...admins);
        break;

      case 'assigned':
      case 'reassigned':
        console.log('Processing assigned/reassigned event...');
        if (assignee) recipients.push(assignee);
        recipients.push(...managers);
        recipients.push(...admins);
        break;

      case 'status_changed':
        console.log('Processing status_changed event...');
        if (userRole !== 'client' && client) recipients.push(client);
        if (userRole !== 'employee' && assignee) recipients.push(assignee);
        if (userRole !== 'manager') recipients.push(...managers);
        if (userRole !== 'admin') recipients.push(...admins);
        break;

      case 'comment_added':
        console.log('Processing comment_added event...');
        if (userRole !== 'client' && client) recipients.push(client);
        if (userRole !== 'employee' && assignee) recipients.push(assignee);
        if (userRole !== 'manager') recipients.push(...managers);
        if (userRole !== 'admin') recipients.push(...admins);
        break;

      default:
        console.log('Processing default event...');
        recipients.push(...managers);
        recipients.push(...admins);
    }

    // Remove duplicates and filter out empty values
    const uniqueRecipients = Array.from(new Set(recipients)).filter(phone => phone && phone.trim());
    console.log('Final recipients after deduplication:', uniqueRecipients);
    console.log('NotificationService.getNotificationRecipients - END');
    return uniqueRecipients;
  }
}