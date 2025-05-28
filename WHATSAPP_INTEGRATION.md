# WhatsApp Integration with WAAPI

This document explains the WhatsApp integration setup and usage for the Complaint Management System using WAAPI.

## Overview

The system automatically sends WhatsApp notifications for all complaint-related events:
- ✅ New complaint created
- ✅ Complaint assigned/reassigned  
- ✅ Status changes
- ✅ Comments added

## Setup Instructions

### 1. WAAPI Account Setup

1. Visit [https://waapi.app](https://waapi.app)
2. Create an account and purchase a subscription plan
3. Create a new WhatsApp instance
4. Get your Instance ID and API Key from the dashboard

### 2. Environment Configuration

Add these variables to your `.env.local` file:

```env
# WhatsApp API Configuration (WAAPI)
WAAPI_INSTANCE_ID=your_instance_id_here
WAAPI_API_KEY=your_api_key_here  
WAAPI_BASE_URL=https://waapi.app/api/v1
```

### 3. WhatsApp Instance Setup

1. Log into your WAAPI dashboard
2. Connect your WhatsApp account to the instance
3. Ensure the instance status shows as "Connected"
4. Test the connection using the admin settings panel

## Phone Number Format

The system automatically formats phone numbers:
- Supports Pakistani numbers: `03001234567` → `923001234567@c.us`
- International format: `923001234567` → `923001234567@c.us`
- Removes non-numeric characters automatically

## Notification Events

### 1. New Complaint Created
**Recipients:** Assignee, Department Managers, Admins
**Trigger:** When a new complaint is submitted
**Message includes:** Complaint ID, Title, Client, Department, Status, Description

### 2. Complaint Assigned/Reassigned  
**Recipients:** New Assignee, Department Managers, Admins
**Trigger:** When complaint is assigned to different user/department
**Message includes:** Complaint ID, Title, From/To assignee, Department

### 3. Status Changed
**Recipients:** All stakeholders except the person who made the change
**Trigger:** When complaint status is updated
**Message includes:** Complaint ID, Title, Old→New Status, Updated by

### 4. Comment Added
**Recipients:** All stakeholders except the commenter
**Trigger:** When new comment is added to complaint
**Message includes:** Complaint ID, Title, Comment preview, Comment author

## User Phone Number Management

Users can set their phone numbers in their profile settings. Only users with valid phone numbers will receive WhatsApp notifications.

### Database Fields
- User model includes `phone` field (optional)
- System validates phone format before sending
- Supports notification preferences per user

## API Endpoints

### Test Connection
```http
GET /api/whatsapp/test
Authorization: Admin only
```

### Send Test Message
```http
POST /api/whatsapp/test
Content-Type: application/json
Authorization: Admin only

{
  "phone": "923001234567",
  "message": "Test message"
}
```

### Get Settings
```http
GET /api/whatsapp/settings
Authorization: Admin only
```

## Admin Panel Features

Access via `/admin/settings/whatsapp`:

1. **Configuration Status** - Shows if WhatsApp API is properly configured
2. **Connection Test** - Test API connectivity
3. **Send Test Message** - Send test notification to verify setup
4. **Environment Setup Guide** - Instructions for configuration

## Error Handling

- Notifications are sent asynchronously and won't block main operations
- Failed notifications are logged but don't affect complaint processing
- System gracefully handles API rate limits with 1-second delays
- Invalid phone numbers are filtered out automatically

## Rate Limiting

- 1-second delay between messages to avoid rate limits
- Background processing prevents API delays from affecting user experience
- Failed messages are logged for monitoring

## Message Templates

### New Complaint
```
🆕 *New Complaint Created*

*ID:* #ABC123
*Title:* Login Issue
*Client:* John Doe
*Department:* IT Support
*Status:* New
*Created by:* Admin User

*Description:*
Unable to login to the system...

View details: https://yourapp.com/admin/complaints/...
```

### Status Update
```
📋 *Complaint Status Updated*

*ID:* #ABC123
*Title:* Login Issue
*Status:* New → *In Progress*
*Updated by:* Jane Smith
*Assigned to:* Tech Support

View details: https://yourapp.com/admin/complaints/...
```

## Security Considerations

- API keys are masked in admin interface (show only last 4 characters)
- Phone numbers are validated and sanitized
- Rate limiting prevents API abuse
- Environment variables keep credentials secure

## Troubleshooting

### Common Issues

1. **Messages not sending**
   - Check WAAPI instance connection status
   - Verify API credentials in environment variables
   - Ensure phone numbers are in correct format
   - Check WAAPI account balance/subscription

2. **Invalid phone numbers**
   - System filters out empty/invalid numbers
   - Check user profile phone number format
   - Verify country code handling

3. **API errors**
   - Check WAAPI dashboard for instance status
   - Verify API key permissions
   - Monitor rate limit status

### Testing

1. Use admin panel test feature
2. Check browser console for errors
3. Monitor server logs for WhatsApp service messages
4. Verify WAAPI dashboard delivery status

## Integration Benefits

- **Real-time notifications** - Instant WhatsApp alerts for all stakeholders
- **Improved response times** - Faster notification delivery than email
- **High engagement** - WhatsApp has higher open rates than email
- **Mobile-first** - Perfect for mobile workforce management
- **Professional formatting** - Rich text messages with emojis and structure
- **Automatic delivery** - No manual intervention required

## Future Enhancements

Potential features for future development:
- Two-way messaging (reply to notifications)
- File attachment notifications
- Customizable message templates
- Department-specific notification rules
- Integration with WhatsApp Business API
- Delivery status tracking
- Message scheduling
