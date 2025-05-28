# WhatsApp Integration Setup Guide

## Files Created:
1. `src/app/admin/test-whatsapp/page.tsx` - Test page for WhatsApp
2. `scripts/debug-whatsapp.js` - Debug script to check setup
3. `scripts/add-phone-numbers.js` - Script to add phone numbers to users

## Steps to Test WhatsApp Integration:

### 1. Start your development server:
```bash
npm run dev
```

### 2. Login as admin and visit the test page:
```
http://localhost:3000/admin/test-whatsapp
```

### 3. Run debug script to check your setup:
```bash
node scripts/debug-whatsapp.js
```

### 4. If users don't have phone numbers, add them:
```bash
# First, edit scripts/add-phone-numbers.js with real user emails
node scripts/add-phone-numbers.js
```

## What Should Happen:

1. **Test Connection** should show "success" if your WAAPI credentials are valid
2. **Send Test Message** should successfully send a WhatsApp message
3. When you create a new complaint, WhatsApp notifications should be sent automatically

## Troubleshooting:

### If connection test fails:
- Check if your WAAPI instance is connected (scan QR code in WAAPI dashboard)
- Verify credentials are correct

### If no users have phone numbers:
- Edit `scripts/add-phone-numbers.js` with actual user emails from your database
- Run the script to add phone numbers

### If complaints don't trigger WhatsApp messages:
- Check server console logs when creating complaints
- Ensure users have phone numbers in correct format (923001234567)

## Current Status:
✅ Environment variables are configured
✅ WAAPI credentials are set
✅ Test page is ready
❓ Need to verify if WAAPI instance is connected
❓ Need to check if users have phone numbers

## Next Steps:
1. Visit the test page: http://localhost:3000/admin/test-whatsapp
2. Click "Test Connection" to verify setup
3. Try sending a test message
4. Create a new complaint to test automatic notifications