# Profile Image Troubleshooting Guide

## 🐛 Debugging Steps

### **1. Check if image was uploaded successfully**

Open browser console and upload an image. Look for these logs:
- "Uploading profile image..."
- "Upload successful: {filename, url, etc.}"
- "Profile updated: {user data with profileImage}"

### **2. Verify file system**

Check if the image file exists:
- Path should be: `public/uploads/profiles/filename.jpg`
- The file should be accessible via: `http://localhost:3000/uploads/profiles/filename.jpg`

### **3. Check database**

The User document should have a `profileImage` field with the URL like:
```
profileImage: "/uploads/profiles/filename_uuid.jpg"
```

### **4. Check session data**

After page reload, check if session includes profileImage:
```javascript
// In browser console after login:
console.log(window.session); // or check in React DevTools
```

### **5. Check UserAvatar component**

The component should receive:
```javascript
user={{
  name: "client",
  profileImage: "/uploads/profiles/filename.jpg", // Should not be null
  email: "client@company.com"
}}
```

## 🔧 **Quick Fixes to Try**

### **Fix 1: Check file permissions**
Make sure the `public/uploads/profiles/` directory exists and is writable.

### **Fix 2: Verify URL format**
The URL should start with `/uploads/` (not `uploads/` or full path).

### **Fix 3: Clear browser cache**
Sometimes cached images prevent new ones from showing.

### **Fix 4: Check MIME types**
Only JPEG, PNG, GIF, WebP should be allowed for profile images.

## 🔍 **Debug Component**

Add this to your profile page temporarily to see what data you're getting:

```jsx
// Add this near the top of your profile page component
console.log('=== DEBUG INFO ===');
console.log('Session:', session);
console.log('Profile:', profile);
console.log('Profile Image URL:', profile?.profileImage);
console.log('Session Profile Image:', session?.user?.profileImage);
```

## 🎯 **Most Likely Issues**

1. **Session not refreshing** - The uploaded image is saved but session still has old data
2. **Wrong URL format** - The URL might be malformed
3. **File not accessible** - The uploaded file might not be in the right location
4. **CORS/Security issues** - Browser might block loading local images

Let me know what you see in the console logs and we can fix the specific issue!
