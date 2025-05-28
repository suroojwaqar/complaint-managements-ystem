#!/bin/bash

# WhatsApp Integration Setup Script
# This script helps set up WhatsApp integration for the Complaint Management System

echo "🚀 WhatsApp Integration Setup for Complaint Management System"
echo "============================================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "✅ Created .env.local file"
else
    echo "✅ Found .env.local file"
fi

echo ""
echo "📋 WhatsApp Integration Setup Checklist:"
echo ""
echo "1. 🔗 WAAPI Account Setup"
echo "   - Visit: https://waapi.app"
echo "   - Create account and purchase subscription"
echo "   - Create WhatsApp instance"
echo "   - Connect your WhatsApp account"
echo ""

echo "2. 🔑 Get API Credentials"
echo "   - Copy Instance ID from WAAPI dashboard"
echo "   - Copy API Key from WAAPI dashboard"
echo ""

echo "3. ⚙️  Configure Environment Variables"
echo "   Edit .env.local and add:"
echo "   WAAPI_INSTANCE_ID=your_instance_id_here"
echo "   WAAPI_API_KEY=your_api_key_here"
echo "   WAAPI_BASE_URL=https://waapi.app/api/v1"
echo ""

echo "4. 🔄 Restart Application"
echo "   - Stop your development server"
echo "   - Run: npm run dev"
echo "   - Or: yarn dev"
echo ""

echo "5. 🧪 Test Integration"
echo "   - Login as admin"
echo "   - Visit: /admin/settings/whatsapp"
echo "   - Test connection"
echo "   - Send test message"
echo ""

echo "📱 Phone Number Requirements:"
echo "   - Users need to add phone numbers in their profiles"
echo "   - Supports Pakistani format: 03001234567"
echo "   - Or international format: 923001234567"
echo ""

echo "🔔 Automatic Notifications:"
echo "   ✅ New complaint created"
echo "   ✅ Complaint assigned/reassigned"
echo "   ✅ Status changes"
echo "   ✅ Comments added"
echo ""

echo "📚 Documentation:"
echo "   - Read WHATSAPP_INTEGRATION.md for detailed setup"
echo "   - Check /admin/settings/whatsapp for status"
echo ""

echo "🎉 Setup complete! Follow the checklist above to enable WhatsApp notifications."
echo ""
