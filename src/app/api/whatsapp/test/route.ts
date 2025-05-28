import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Test WhatsApp API connection
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        status: 'error',
        message: 'Admin access required. Please login as admin first.',
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Check if credentials are configured
    const instanceId = process.env.WAAPI_INSTANCE_ID;
    const apiKey = process.env.WAAPI_API_KEY;
    const baseUrl = process.env.WAAPI_BASE_URL || 'https://waapi.app/api/v1';

    if (!instanceId || !apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'WhatsApp API credentials not configured. Please set WAAPI_INSTANCE_ID and WAAPI_API_KEY in your .env.local file.',
        timestamp: new Date().toISOString()
      });
    }

    console.log('Testing WhatsApp connection...');
    console.log('Instance ID:', instanceId);
    console.log('API Key:', apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-8)}` : 'NOT SET');
    console.log('Base URL:', baseUrl);
    
    const connectionUrl = `${baseUrl}/instances/${instanceId}/client/action/is-connected`;
    console.log('Connection URL:', connectionUrl);

    // Test connection to WAAPI
    const response = await fetch(connectionUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
    });

    console.log('WAAPI Response Status:', response.status, response.statusText);

    if (response.status === 403) {
      return NextResponse.json({
        status: 'error',
        message: 'WhatsApp API credentials are invalid (403 Forbidden). Please check your WAAPI_INSTANCE_ID and WAAPI_API_KEY.',
        timestamp: new Date().toISOString(),
        debug: {
          instanceId: instanceId,
          responseStatus: response.status
        }
      });
    }

    if (response.status === 404) {
      return NextResponse.json({
        status: 'error',
        message: 'WhatsApp instance not found (404). Please check your WAAPI_INSTANCE_ID.',
        timestamp: new Date().toISOString(),
        debug: {
          instanceId: instanceId,
          responseStatus: response.status
        }
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        status: 'error',
        message: `WhatsApp API error: ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString(),
        debug: {
          responseStatus: response.status,
          errorDetails: errorText
        }
      });
    }

    const result = await response.json();
    console.log('Connection test result:', result);
    
    return NextResponse.json({
      status: 'success',
      message: `WhatsApp instance is ${result.connected ? 'connected and ready' : 'configured but not connected (scan QR code)'}`,
      timestamp: new Date().toISOString(),
      debug: {
        instanceId: instanceId,
        connected: result.connected,
        apiResponse: result
      }
    });

  } catch (error: any) {
    console.error('Error testing WhatsApp connection:', error);
    return NextResponse.json({
      status: 'error',
      message: `Network error: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Send test WhatsApp message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ 
        status: 'error',
        message: 'Admin access required. Please login as admin first.',
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    const { phone, message } = await request.json();
    
    if (!phone || !message) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Phone number and message are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Check credentials
    const instanceId = process.env.WAAPI_INSTANCE_ID;
    const apiKey = process.env.WAAPI_API_KEY;
    const baseUrl = process.env.WAAPI_BASE_URL || 'https://waapi.app/api/v1';

    if (!instanceId || !apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'WhatsApp API credentials not configured. Please set WAAPI_INSTANCE_ID and WAAPI_API_KEY in your .env.local file.',
        timestamp: new Date().toISOString()
      });
    }

    // Format phone number for WhatsApp
    const formatPhoneNumber = (phone: string): string => {
      let cleaned = phone.replace(/\D/g, '');
      
      // Handle Pakistani number formats
      if (cleaned.startsWith('0')) {
        // Convert 0334398234 to 92334398234
        cleaned = '92' + cleaned.slice(1);
      } else if (cleaned.length === 10 && !cleaned.startsWith('92')) {
        // Convert 334398234 to 92334398234
        cleaned = '92' + cleaned;
      } else if (!cleaned.startsWith('92') && cleaned.length === 11) {
        // Handle 11 digit numbers without country code
        cleaned = '92' + cleaned.slice(1);
      }
      
      return cleaned + '@c.us';
    };

    const chatId = formatPhoneNumber(phone);
    const testMessage = `🧪 *TEST MESSAGE*\n\n${message}\n\n✅ Sent at: ${new Date().toLocaleString()}\n📱 From: Complaint Management System\n👤 By: ${session.user.name}`;

    console.log(`Sending test message to: ${chatId}`);
    console.log(`Message length: ${testMessage.length} characters`);
    console.log('Base URL:', baseUrl);

    // Send message via WAAPI
    const payload = {
      chatId: chatId,
      message: testMessage
    };

    const sendUrl = `${baseUrl}/instances/${instanceId}/client/action/send-message`;
    console.log('Send URL:', sendUrl);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const headers = {
      'accept': 'application/json',
      'authorization': `Bearer ${apiKey}`,
      'content-type': 'application/json',
    };
    
    console.log('Request Headers:', {
      'accept': headers.accept,
      'authorization': `Bearer ${apiKey.slice(0, 8)}...${apiKey.slice(-8)}`,
      'content-type': headers['content-type']
    });

    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }

    console.log('WAAPI Response:', {
      status: response.status,
      statusText: response.statusText,
      body: result
    });

    if (response.status === 403) {
      return NextResponse.json({
        status: 'error',
        message: 'WhatsApp API credentials are invalid (403 Forbidden). Please check your WAAPI_INSTANCE_ID and WAAPI_API_KEY.',
        timestamp: new Date().toISOString(),
        debug: {
          chatId: chatId,
          responseStatus: response.status,
          apiResponse: result
        }
      });
    }

    if (response.status === 404) {
      return NextResponse.json({
        status: 'error',
        message: 'WhatsApp instance not found (404). Please check your WAAPI_INSTANCE_ID.',
        timestamp: new Date().toISOString(),
        debug: {
          chatId: chatId,
          responseStatus: response.status,
          apiResponse: result
        }
      });
    }

    if (!response.ok) {
      return NextResponse.json({
        status: 'error',
        message: `WhatsApp API Error: ${response.status} ${response.statusText}`,
        timestamp: new Date().toISOString(),
        debug: {
          chatId: chatId,
          responseStatus: response.status,
          apiResponse: result
        }
      });
    }

    // Success
    return NextResponse.json({
      status: 'success',
      message: `Test WhatsApp message sent successfully to ${phone}`,
      timestamp: new Date().toISOString(),
      debug: {
        originalPhone: phone,
        formattedChatId: chatId,
        messageLength: testMessage.length,
        apiResponse: result
      }
    });

  } catch (error: any) {
    console.error('Error sending test WhatsApp message:', error);
    return NextResponse.json({
      status: 'error',
      message: `Network error: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}