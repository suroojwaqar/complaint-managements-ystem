import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Send test WhatsApp message - simplified version matching exact curl format
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required. Please login as admin first.'
      }, { status: 403 });
    }

    const { phone, message } = await request.json();
    
    if (!phone || !message) {
      return NextResponse.json({ 
        error: 'Phone number and message are required'
      }, { status: 400 });
    }

    const instanceId = process.env.WAAPI_INSTANCE_ID;
    const apiKey = process.env.WAAPI_API_KEY;

    if (!instanceId || !apiKey) {
      return NextResponse.json({
        error: 'WhatsApp API credentials not configured'
      }, { status: 500 });
    }

    // Format phone number exactly like your working curl
    const formatPhoneNumber = (phone: string): string => {
      let cleaned = phone.replace(/\D/g, '');
      
      // If it starts with 0, replace with 92
      if (cleaned.startsWith('0')) {
        cleaned = '92' + cleaned.slice(1);
      }
      // If it doesn't start with 92, add 92
      else if (!cleaned.startsWith('92')) {
        cleaned = '92' + cleaned;
      }
      
      return cleaned + '@c.us';
    };

    const chatId = formatPhoneNumber(phone);
    
    console.log('=== SENDING WHATSAPP MESSAGE ===');
    console.log('Original phone:', phone);
    console.log('Formatted chatId:', chatId);
    console.log('Instance ID:', instanceId);
    console.log('API Key (first 8 chars):', apiKey.slice(0, 8) + '...');
    console.log('Base URL:', `https://waapi.app/api/v1`);

    // Exact same request format as your working curl
    const payload = {
      chatId: chatId,
      message: message
    };

    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const fullUrl = `https://waapi.app/api/v1/instances/${instanceId}/client/action/send-message`;
    console.log('Full URL:', fullUrl);
    
    const headers = {
      'accept': 'application/json',
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json'
    };
    
    console.log('Request Headers:', {
      'accept': headers.accept,
      'authorization': `Bearer ${apiKey.slice(0, 8)}...${apiKey.slice(-8)}`,
      'content-type': headers['content-type']
    });

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('Response URL:', response.url);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `WhatsApp message sent successfully to ${phone}`,
        chatId: chatId,
        response: result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `WAAPI Error: ${response.status} ${response.statusText}`,
        chatId: chatId,
        response: result
      }, { status: response.status });
    }

  } catch (error: any) {
    console.error('Error in WhatsApp API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}