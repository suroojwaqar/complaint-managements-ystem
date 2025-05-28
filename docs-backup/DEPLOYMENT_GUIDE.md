# 🚀 Vercel Deployment Guide

## ✅ Fixed Issues

1. **Removed duplicate NextAuth configuration** - Deleted conflicting `auth.config.ts`
2. **Fixed MongoDB connection** - Added proper serverless caching
3. **Updated all models** - Using correct serverless pattern
4. **Fixed TypeScript declarations** - Cleaned up next-auth types
5. **Updated package.json** - Removed problematic dependencies
6. **Created Vercel configuration** - Added `vercel.json` for optimization

## 🔧 Pre-Deployment Steps

### 1. Generate NextAuth Secret
```bash
openssl rand -base64 32
```
Copy the output and use it as your `NEXTAUTH_SECRET`

### 2. Build Test (REQUIRED)
```bash
npm run build
```
Fix any TypeScript errors before proceeding.

### 3. Test Locally
```bash
npm run start
```

## 📁 Files Changed/Created

### Modified:
- ✅ `src/app/api/auth/[...nextauth]/route.ts` - Consolidated auth config
- ✅ `src/lib/mongodb.ts` - Fixed serverless caching
- ✅ `src/models/User.ts` - Added proper model export pattern
- ✅ `src/models/Complaint.ts` - Fixed model caching
- ✅ `src/types/next-auth.d.ts` - Cleaned up type declarations
- ✅ `next.config.js` - Updated for Vercel compatibility
- ✅ `package.json` - Removed problematic dependencies

### Created:
- ✅ `vercel.json` - Vercel-specific configuration
- ✅ `.env.example` - Template for environment variables

### Removed:
- ❌ `src/app/api/auth/[...nextauth]/auth.config.ts` - Duplicate configuration

## 🌐 Vercel Environment Variables

Add these in your Vercel dashboard:

```
MONGODB_URI = mongodb+srv://kamranmushtaqsays:XQ40t3ObH2n8Thbn@lms.zt6a5.mongodb.net/complaint-management-tool?retryWrites=true&w=majority&appName=LMS

NEXTAUTH_SECRET = your_generated_32_char_secret

NEXTAUTH_URL = https://your-vercel-domain.vercel.app

WAAPI_APP_API_KEY = your_whatsapp_api_key_if_using
```

## ⚠️ IMPORTANT SECURITY NOTES

1. **NEVER commit `.env.local` to Git** - It's in `.gitignore`
2. **Generate a NEW `NEXTAUTH_SECRET`** - Don't use the placeholder
3. **Update `NEXTAUTH_URL`** to your actual Vercel domain after deployment
4. **Consider using separate MongoDB databases** for development/production

## 🚀 Deploy to Vercel

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

## 🧪 Post-Deployment Testing

Test these endpoints:
- `/api/test` - General functionality test
- `/login` - Authentication
- `/api/complaints` - Database operations

## 🔍 Common Issues & Solutions

### Build Errors:
- Run `npm run build` locally first
- Fix TypeScript errors before deploying

### Database Connection Issues:
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Vercel)

### Authentication Issues:
- Ensure `NEXTAUTH_SECRET` is set
- Update `NEXTAUTH_URL` to your Vercel domain

### API Route Errors:
- Check Vercel function logs
- Verify all models use the serverless pattern

Your deployment should now work! 🎉